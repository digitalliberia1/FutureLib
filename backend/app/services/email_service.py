import logging
from app.config import settings

logger = logging.getLogger(__name__)


async def send_verification_email(email: str, full_name: str, token: str):
    verify_url = f"https://futurelib.gov.lr/verify-email?token={token}"
    logger.info(f"[EMAIL] Verification email to {email}: {verify_url}")
    # TODO: integrate SMTP / SendGrid in production


async def send_password_reset_email(email: str, full_name: str, token: str):
    reset_url = f"https://futurelib.gov.lr/reset-password?token={token}"
    logger.info(f"[EMAIL] Password reset email to {email}: {reset_url}")


async def send_welcome_email(email: str, full_name: str):
    logger.info(f"[EMAIL] Welcome email to {email} ({full_name})")


async def send_application_status_email(email: str, full_name: str, service: str, status: str):
    logger.info(f"[EMAIL] Application status update to {email}: {service} -> {status}")
