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


def smtp_configured() -> bool:
    """Return True when all SMTP settings are present."""

    return bool(
        _settings.smtp_host
        and _settings.smtp_port
        and _settings.smtp_user
        and _settings.smtp_pass
        and _settings.smtp_from
    )


async def send_plain_email(to_email: str, subject: str, body: str) -> None:
    """Send a simple text email with configuration safety checks."""

    if not smtp_configured():
        raise RuntimeError("SMTP settings are not configured")

    message = build_message(to_email, subject, body)
    await send_mail(message)
