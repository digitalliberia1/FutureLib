"""
Extra LMS Django settings injected via Tutor's patch mechanism.

Place this file at:
  $(tutor config printroot)/env/apps/openedx/settings/lms/production.py
  OR reference it from a Tutor plugin using the openedx-lms-production-settings patch.

These settings enable:
  1. FutureLib as a trusted OAuth2 third-party-auth provider (SSO).
  2. CORS permissions for the FutureLib React frontend.
  3. JWT token configuration for seamless API access.
  4. Certificate generation for FutureLib-branded certs.
"""

# ─── JWT / OAuth2 ─────────────────────────────────────────────────────────────
JWT_AUTH.update({                                           # noqa: F821
    "JWT_ISSUERS": [
        {
            "ISSUER": "futurelib-client",
            "SECRET_KEY": os.environ.get("FUTURELIB_JWT_SECRET", "CHANGE_THIS"),  # noqa: F821
            "AUDIENCE": "lms",
        }
    ],
    "JWT_ALGORITHM": "HS256",
    "JWT_EXPIRATION_DELTA": 300,
    "JWT_AUTH_COOKIE": "edx-jwt-cookie",
})

# ─── Third-party auth (FutureLib as OAuth2 provider) ─────────────────────────
THIRD_PARTY_AUTH_BACKENDS = [
    "social_core.backends.oauth.BaseOAuth2",
]

THIRD_PARTY_AUTH_PIPELINE = [
    "social_core.pipeline.social_auth.social_details",
    "social_core.pipeline.social_auth.social_uid",
    "social_core.pipeline.social_auth.auth_allowed",
    "social_core.pipeline.social_auth.social_user",
    "social_core.pipeline.user.get_username",
    "social_core.pipeline.user.create_user",
    "social_core.pipeline.social_auth.associate_user",
    "social_core.pipeline.social_auth.load_extra_data",
    "social_core.pipeline.user.user_details",
]

# ─── CORS — allow FutureLib frontend ─────────────────────────────────────────
CORS_ORIGIN_WHITELIST += [                                  # noqa: F821
    "https://futurelib.gov.lr",
    "http://localhost:3000",
]
CORS_ALLOW_HEADERS = (
    "x-requested-with", "content-type", "accept", "origin",
    "authorization", "x-csrftoken", "user-agent", "accept-encoding",
    "cache-control", "use-jwt-cookie",
)
CORS_ALLOW_CREDENTIALS = True

# ─── Certificate branding ────────────────────────────────────────────────────
PLATFORM_NAME = "FutureLib"
CERT_NAME_SHORT = "FutureLib Certificate"
CERT_NAME_LONG = "FutureLib National Digital Skills Certificate"

# ─── Enrollment API — allow server-to-server enrollment ──────────────────────
ENROLLMENT_API_RESTRICT_BY_EMAIL_DOMAIN = False

# ─── Completion tracking ─────────────────────────────────────────────────────
COMPLETION_AGGREGATOR_ASYNC_AGGREGATION = False
