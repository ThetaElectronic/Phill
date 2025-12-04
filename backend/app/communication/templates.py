from datetime import datetime

from sqlmodel import Session

from app.communication.models import EmailTemplate


DEFAULT_TEMPLATES: dict[str, dict[str, str]] = {
    "welcome_new_user": {
        "subject": "Welcome to Phill",
        "body": """Welcome to Phill!\n\nYour account has been created. Sign in to start chatting with Phill AI and upload any training documents your team needs.\n\nIf you were assigned a temporary password, please update it after logging in from the Account page.\n\n– The Phill team""",
    }
}


def get_or_create_template(session: Session, key: str) -> EmailTemplate:
    template = session.get(EmailTemplate, key)
    if template:
        return template

    defaults = DEFAULT_TEMPLATES.get(key, {"subject": key.replace("_", " ").title(), "body": ""})
    template = EmailTemplate(key=key, subject=defaults.get("subject", ""), body=defaults.get("body", ""))
    session.add(template)
    session.commit()
    session.refresh(template)
    return template


def update_template(session: Session, key: str, subject: str, body: str) -> EmailTemplate:
    template = get_or_create_template(session, key)
    template.subject = subject
    template.body = body
    template.updated_at = datetime.utcnow()
    session.add(template)
    session.commit()
    session.refresh(template)
    return template
