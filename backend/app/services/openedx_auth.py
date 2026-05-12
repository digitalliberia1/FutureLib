"""
Open edX SSO and user-provisioning service.

Responsibilities:
  1. Auto-provision a FutureLib user into Open edX on first LMS interaction.
  2. Generate a short-lived SSO URL that logs the user into Open edX LMS
     without a second password prompt (JWT-based auto-login endpoint).
  3. Exchange a FutureLib JWT for a user-scoped Open edX OAuth2 token so the
     frontend can call Open edX APIs directly when needed.

Open edX auto-login relies on the "jwt_auth" feature exposed by Tutor's
juniper+ releases:  POST /api/user/v1/login_session  (username+password)
or the social-auth/third-party flow.  For production, configure Open edX as
an OAuth2 Relying Party pointing at FutureLib (see infrastructure/tutor/).
"""

import secrets
import string
import logging
import httpx

from app.config import settings
from app.services import openedx_client as lms

logger = logging.getLogger(__name__)

_OPENEDX_USERNAME_MAX = 30  # Open edX hard limit


def _make_openedx_username(full_name: str, email: str) -> str:
    """Derive a valid Open edX username (alphanumeric + _ + -) from user data."""
    base = (full_name or email.split("@")[0]).lower()
    clean = "".join(c if c.isalnum() or c in "-_" else "_" for c in base)
    return clean[:_OPENEDX_USERNAME_MAX].strip("_-") or "user"


def _random_password(length: int = 20) -> str:
    alphabet = string.ascii_letters + string.digits + "!@#$%"
    return "".join(secrets.choice(alphabet) for _ in range(length))


async def provision_user(
    full_name: str,
    email: str,
    futurelib_user_id: str,
) -> dict:
    """
    Ensure the FutureLib user exists on Open edX.

    Returns a dict with at minimum:
        { "username": str, "already_existed": bool }
    """
    username = _make_openedx_username(full_name, email)

    # Check if already exists
    existing = await lms.get_openedx_user(username)
    if existing:
        return {"username": username, "already_existed": True}

    # If username is taken by a different email, append a short suffix
    if existing and existing.get("email") != email:
        suffix = futurelib_user_id[:6]
        username = f"{username}_{suffix}"[:_OPENEDX_USERNAME_MAX]
        existing = await lms.get_openedx_user(username)
        if existing:
            return {"username": username, "already_existed": True}

    password = _random_password()
    try:
        await lms.register_openedx_user(
            username=username,
            email=email,
            name=full_name,
            password=password,
        )
        logger.info("Provisioned Open edX user: %s", username)
        return {"username": username, "already_existed": False}
    except httpx.HTTPStatusError as exc:
        body = exc.response.text
        # 409 → username/email already registered — treat as success
        if exc.response.status_code == 409:
            logger.debug("Open edX user already exists (409): %s", username)
            return {"username": username, "already_existed": True}
        logger.error("Failed to provision Open edX user %s: %s", username, body)
        raise


async def get_sso_url(username: str, next_url: str = "/dashboard") -> str:
    """
    Build a URL that, when followed from the browser, logs the user into Open edX.

    Strategy: use Open edX's JWT-based auto-login if OPENEDX_AUTO_PROVISION is
    enabled. We call POST /api/user/v1/login_session with the service account
    credentials and obtain a session cookie redirect URL, OR we rely on the
    third-party auth redirect from the FutureLib OAuth2 provider.

    For Tutor setups the simplest reliable approach is the JWT_AUTH token:
        GET {LMS}/login?next={next_url}&jwt={user_jwt}
    which requires the LMS to be configured with ENABLE_AUTO_AUTH and a
    shared signing key (see infrastructure/tutor/lms-extra-settings.py).
    """
    from jose import jwt as jose_jwt
    import time

    payload = {
        "preferred_username": username,
        "iss": settings.OPENEDX_CLIENT_ID,
        "sub": username,
        "iat": int(time.time()),
        "exp": int(time.time()) + 300,  # 5-minute single-use window
    }
    token = jose_jwt.encode(payload, settings.OPENEDX_LTI_SECRET or settings.SECRET_KEY, algorithm="HS256")
    return f"{settings.OPENEDX_LMS_URL}/auth/login/futurelib-oauth2/?next={next_url}&sso_token={token}"


async def get_user_lms_token(username: str, password: str) -> dict:
    """
    Exchange username+password for a user-scoped Open edX JWT.

    Only used when we stored the password (provisioning flow). In production
    prefer OAuth2 authorization-code flow.
    """
    return await lms.get_user_token(username, password)
