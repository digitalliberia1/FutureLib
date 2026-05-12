from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    APP_NAME: str = "FutureLib"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    # MongoDB
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "futurelib"

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # JWT
    SECRET_KEY: str = "change-me-in-production-use-a-long-random-string"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://futurelib.gov.lr",
    ]

    # Email
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = "noreply@futurelib.gov.lr"
    EMAIL_FROM_NAME: str = "FutureLib"

    # File Storage (S3-compatible)
    S3_BUCKET: str = ""
    S3_REGION: str = "us-east-1"
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""

    # OpenAI
    OPENAI_API_KEY: str = ""

    # Stripe
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""

    # Rate limiting
    RATE_LIMIT_PER_MINUTE: int = 60

    # Open edX Integration
    OPENEDX_LMS_URL: str = "http://lms.local.edly.io"
    OPENEDX_CMS_URL: str = "http://studio.local.edly.io"
    OPENEDX_DISCOVERY_URL: str = "http://discovery.local.edly.io"
    OPENEDX_CLIENT_ID: str = ""
    OPENEDX_CLIENT_SECRET: str = ""
    # Scopes for server-to-server OAuth2 token
    OPENEDX_OAUTH_SCOPES: str = "user_id profile email"
    # Platform name shown in Open edX emails / UI
    OPENEDX_PLATFORM_NAME: str = "FutureLib"
    # When True, auto-provision FutureLib users on Open edX at first course access
    OPENEDX_AUTO_PROVISION: bool = True
    # LTI shared secret (optional LTI tool integration)
    OPENEDX_LTI_SECRET: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
