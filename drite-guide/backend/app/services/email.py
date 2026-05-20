import logging
import smtplib
from email.message import EmailMessage
from email.utils import formataddr
from urllib.parse import quote

from app.core.config import settings


logger = logging.getLogger(__name__)


class EmailService:
    async def send_verification_email(self, email: str, token: str) -> None:
        public_base_url = settings.BACKEND_PUBLIC_BASE_URL.rstrip("/")
        api_prefix = "" if public_base_url.endswith(settings.API_V1_PREFIX) else settings.API_V1_PREFIX
        verification_url = (
            f"{public_base_url}"
            f"{api_prefix}/auth/verify-email?token={quote(token)}"
        )

        if not settings.SMTP_HOST or not settings.SMTP_FROM_EMAIL:
            logger.info("Verification email for %s: %s", email, verification_url)
            return

        message = EmailMessage()
        message["Subject"] = "Verify your Drite Guide email"
        message["From"] = formataddr((settings.SMTP_FROM_NAME, settings.SMTP_FROM_EMAIL))
        message["To"] = email
        message.set_content(
            "\n".join(
                [
                    "Welcome to Drite Guide.",
                    "",
                    "Please verify your email address with this link:",
                    verification_url,
                    "",
                    "This link expires automatically.",
                ]
            )
        )

        await self._send_message(message)

    async def _send_message(self, message: EmailMessage) -> None:
        import asyncio

        await asyncio.to_thread(self._send_message_sync, message)

    def _send_message_sync(self, message: EmailMessage) -> None:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as smtp:
            if settings.SMTP_USE_TLS:
                smtp.starttls()

            if settings.SMTP_USERNAME:
                smtp.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)

            smtp.send_message(message)


email_service = EmailService()
