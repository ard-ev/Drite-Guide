import logging

from app.core.config import settings


logger = logging.getLogger(__name__)


class EmailService:
    async def send_verification_email(self, email: str, token: str) -> None:
        verification_url = f"{settings.FRONTEND_BASE_URL}/verify-email?token={token}"
        logger.info("Verification email for %s: %s", email, verification_url)


email_service = EmailService()

