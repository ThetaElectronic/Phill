import asyncio

from app.communication.email import build_message, send_mail


def send_test_email(recipient: str) -> None:
    message = build_message(recipient, "Phill test email", "This is a test email from Phill.")
    asyncio.run(send_mail(message))
