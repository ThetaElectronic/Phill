import aiosmtplib
from email.message import EmailMessage

from app.config import get_settings


def build_message(to_email: str, subject: str, body: str) -> EmailMessage:
    settings = get_settings()
    msg = EmailMessage()
    msg["From"] = settings.smtp_from if hasattr(settings, "smtp_from") else "no-reply@example.com"
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.set_content(body)
    return msg


async def send_mail(message: EmailMessage) -> None:
    settings = get_settings()
    use_tls = bool(settings.smtp_use_tls)
    start_tls = bool(settings.smtp_starttls) if not use_tls else False
    await aiosmtplib.send(
        message,
        hostname=settings.smtp_host,
        port=settings.smtp_port,
        username=settings.smtp_user,
        password=settings.smtp_pass,
        start_tls=start_tls,
        use_tls=use_tls,
    )


def smtp_configured() -> bool:
    """Return True when all SMTP settings are present."""

    return bool(
        get_settings().smtp_host
        and get_settings().smtp_port
        and get_settings().smtp_user
        and get_settings().smtp_pass
        and get_settings().smtp_from
    )


def smtp_status() -> dict[str, object]:
    settings = get_settings()
    configured = smtp_configured()
    return {
        "configured": configured,
        "host": settings.smtp_host,
        "from": settings.smtp_from,
        "starttls": bool(settings.smtp_starttls),
        "use_tls": bool(settings.smtp_use_tls),
    }


async def send_plain_email(to_email: str, subject: str, body: str) -> None:
    """Send a simple text email with configuration safety checks."""

    if not smtp_configured():
        raise RuntimeError("SMTP settings are not configured")

    message = build_message(to_email, subject, body)
    await send_mail(message)
