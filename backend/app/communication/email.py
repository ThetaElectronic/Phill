import aiosmtplib
from email.message import EmailMessage

from app.config import get_settings

_settings = get_settings()


def build_message(to_email: str, subject: str, body: str) -> EmailMessage:
    msg = EmailMessage()
    msg["From"] = _settings.smtp_from if hasattr(_settings, "smtp_from") else "no-reply@example.com"
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.set_content(body)
    return msg


async def send_mail(message: EmailMessage) -> None:
    await aiosmtplib.send(
        message,
        hostname=_settings.smtp_host,
        port=_settings.smtp_port,
        username=_settings.smtp_user,
        password=_settings.smtp_pass,
        start_tls=True,
    )
