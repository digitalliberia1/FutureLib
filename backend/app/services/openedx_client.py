"""
Open edX API client — async httpx-based, with OAuth2 client-credentials token caching.

All methods raise httpx.HTTPStatusError on non-2xx responses so callers can
translate them into FastAPI HTTPExceptions as appropriate.
"""

import time
import logging
from typing import Any, Optional
import httpx
from app.config import settings

logger = logging.getLogger(__name__)

_TOKEN_CACHE: dict[str, Any] = {"access_token": None, "expires_at": 0.0}


async def _get_server_token() -> str:
    """Return a cached OAuth2 client-credentials token, refreshing when needed."""
    if _TOKEN_CACHE["access_token"] and time.time() < _TOKEN_CACHE["expires_at"] - 30:
        return _TOKEN_CACHE["access_token"]

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(
            f"{settings.OPENEDX_LMS_URL}/oauth2/access_token",
            data={
                "grant_type": "client_credentials",
                "client_id": settings.OPENEDX_CLIENT_ID,
                "client_secret": settings.OPENEDX_CLIENT_SECRET,
                "token_type": "jwt",
            },
        )
        resp.raise_for_status()
        token_data = resp.json()

    _TOKEN_CACHE["access_token"] = token_data["access_token"]
    _TOKEN_CACHE["expires_at"] = time.time() + token_data.get("expires_in", 3600)
    return _TOKEN_CACHE["access_token"]


def _auth_headers(token: str) -> dict:
    return {"Authorization": f"JWT {token}"}


# ─── Course Catalog ───────────────────────────────────────────────────────────

async def list_courses(
    page: int = 1,
    page_size: int = 20,
    search: Optional[str] = None,
    org: Optional[str] = None,
) -> dict:
    """GET /api/courses/v1/courses/ — public course catalog."""
    params: dict = {"page": page, "page_size": page_size, "mobile_only": "false"}
    if search:
        params["search_term"] = search
    if org:
        params["org"] = org

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            f"{settings.OPENEDX_LMS_URL}/api/courses/v1/courses/",
            params=params,
        )
        resp.raise_for_status()
    return resp.json()


async def get_course(course_id: str) -> dict:
    """GET /api/courses/v1/courses/{course_id}/ — single course detail."""
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            f"{settings.OPENEDX_LMS_URL}/api/courses/v1/courses/{course_id}/",
        )
        resp.raise_for_status()
    return resp.json()


async def get_course_blocks(course_id: str, username: str) -> dict:
    """GET /api/courses/v1/blocks/ — course content block tree for a user."""
    token = await _get_server_token()
    async with httpx.AsyncClient(timeout=20) as client:
        resp = await client.get(
            f"{settings.OPENEDX_LMS_URL}/api/courses/v1/blocks/",
            params={
                "course_id": course_id,
                "username": username,
                "depth": "all",
                "requested_fields": "children,display_name,type,student_view_url,complete",
                "student_view_data": "video,discussion",
                "block_types_filter": "video,html,problem,discussion,chapter,sequential,vertical",
            },
            headers=_auth_headers(token),
        )
        resp.raise_for_status()
    return resp.json()


# ─── Enrollment ───────────────────────────────────────────────────────────────

async def enroll_user(username: str, course_id: str, mode: str = "honor") -> dict:
    """POST /api/enrollment/v1/enrollment — enroll a user in a course."""
    token = await _get_server_token()
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(
            f"{settings.OPENEDX_LMS_URL}/api/enrollment/v1/enrollment",
            json={"course_details": {"course_id": course_id}, "user": username, "mode": mode},
            headers=_auth_headers(token),
        )
        resp.raise_for_status()
    return resp.json()


async def get_enrollment(username: str, course_id: str) -> Optional[dict]:
    """GET /api/enrollment/v1/enrollment/{username},{course_id}"""
    token = await _get_server_token()
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            f"{settings.OPENEDX_LMS_URL}/api/enrollment/v1/enrollment/{username},{course_id}",
            headers=_auth_headers(token),
        )
        if resp.status_code == 404:
            return None
        resp.raise_for_status()
    return resp.json()


async def list_user_enrollments(username: str) -> list:
    """GET /api/enrollment/v1/enrollment?user={username}"""
    token = await _get_server_token()
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            f"{settings.OPENEDX_LMS_URL}/api/enrollment/v1/enrollment",
            params={"user": username},
            headers=_auth_headers(token),
        )
        resp.raise_for_status()
    return resp.json()


# ─── Progress ─────────────────────────────────────────────────────────────────

async def get_course_progress(username: str, course_id: str) -> dict:
    """GET /api/course_home/v1/progress/{course_id}?username={username}"""
    token = await _get_server_token()
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            f"{settings.OPENEDX_LMS_URL}/api/course_home/v1/progress/{course_id}",
            params={"username": username},
            headers=_auth_headers(token),
        )
        resp.raise_for_status()
    return resp.json()


async def get_completion_summary(username: str, course_id: str) -> dict:
    """GET /api/completion/v1/course/{course_id}/?username={username}"""
    token = await _get_server_token()
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            f"{settings.OPENEDX_LMS_URL}/api/completion/v1/course/{course_id}/",
            params={"username": username},
            headers=_auth_headers(token),
        )
        resp.raise_for_status()
    return resp.json()


# ─── Certificates ─────────────────────────────────────────────────────────────

async def get_certificates(username: str) -> list:
    """GET /api/certificates/v0/certificates/{username}"""
    token = await _get_server_token()
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            f"{settings.OPENEDX_LMS_URL}/api/certificates/v0/certificates/{username}",
            headers=_auth_headers(token),
        )
        resp.raise_for_status()
    data = resp.json()
    return data.get("results", data) if isinstance(data, dict) else data


# ─── Grades ───────────────────────────────────────────────────────────────────

async def get_grades(username: str, course_id: str) -> dict:
    """GET /api/grades/v1/courses/{course_id}/?username={username}"""
    token = await _get_server_token()
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            f"{settings.OPENEDX_LMS_URL}/api/grades/v1/courses/{course_id}/",
            params={"username": username},
            headers=_auth_headers(token),
        )
        resp.raise_for_status()
    data = resp.json()
    results = data.get("results", [])
    return results[0] if results else {}


# ─── User Account ─────────────────────────────────────────────────────────────

async def get_openedx_user(username: str) -> Optional[dict]:
    """GET /api/user/v1/accounts/{username}"""
    token = await _get_server_token()
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            f"{settings.OPENEDX_LMS_URL}/api/user/v1/accounts/{username}",
            headers=_auth_headers(token),
        )
        if resp.status_code == 404:
            return None
        resp.raise_for_status()
    return resp.json()


async def register_openedx_user(
    username: str,
    email: str,
    name: str,
    password: str,
) -> dict:
    """POST /api/user/v1/account/registration/ — create user in Open edX."""
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(
            f"{settings.OPENEDX_LMS_URL}/api/user/v1/account/registration/",
            data={
                "username": username,
                "email": email,
                "name": name,
                "password": password,
                "honor_code": "true",
                "terms_of_service": "true",
            },
        )
        resp.raise_for_status()
    return resp.json()


async def get_user_token(username: str, password: str) -> dict:
    """POST /oauth2/access_token with password grant — get user-scoped JWT."""
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(
            f"{settings.OPENEDX_LMS_URL}/oauth2/access_token",
            data={
                "grant_type": "password",
                "client_id": settings.OPENEDX_CLIENT_ID,
                "client_secret": settings.OPENEDX_CLIENT_SECRET,
                "username": username,
                "password": password,
                "token_type": "jwt",
            },
        )
        resp.raise_for_status()
    return resp.json()
