from datetime import datetime, timedelta, timezone

import hashlib
import logging
import secrets

from fastapi import APIRouter, Body, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from sqlalchemy import or_
from sqlmodel import Session, select

from app.config import get_settings
from app.db import get_session
from app.communication.email import send_plain_email, smtp_configured
from app.security.password import hash_password, verify_password
from app.security.tokens import TokenType, create_access_token, create_refresh_token, decode_token
from app.users.models import AccessRequest, PasswordResetRequest, PasswordResetToken, User

router = APIRouter()
settings = get_settings()
logger = logging.getLogger(__name__)


class PasswordResetRequestPayload(BaseModel):
    email: EmailStr


class AccessRequestPayload(BaseModel):
    email: EmailStr
    note: str | None = None


class EmailLoginPayload(BaseModel):
    email: EmailStr
    password: str


class ConfirmResetPayload(BaseModel):
    token: str
    new_password: str


def _authenticate(identifier: str, password: str, session: Session) -> User:
    user = session.exec(
        select(User).where(or_(User.username == identifier, User.email == identifier))
    ).first()
    if not user or not verify_password(password, user.password_hash) or user.disabled:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect credentials")
    return user


@router.post("/token")
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)
) -> dict[str, str]:
    user = _authenticate(form_data.username, form_data.password, session)

    return {
        "access_token": create_access_token(user.id),
        "refresh_token": create_refresh_token(user.id),
        "token_type": "bearer",
    }


@router.post("/login")
def login_with_email(payload: EmailLoginPayload, session: Session = Depends(get_session)) -> dict[str, str]:
    user = _authenticate(payload.email, payload.password, session)
    return {
        "access_token": create_access_token(user.id),
        "refresh_token": create_refresh_token(user.id),
        "token_type": "bearer",
    }


@router.post("/refresh")
def refresh_access_token(
    refresh_token: str = Body(embed=True), session: Session = Depends(get_session)
) -> dict[str, str]:
    try:
        payload = decode_token(refresh_token)
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    if payload.get("type") != TokenType.REFRESH:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")

    subject = payload.get("sub")
    if not subject:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject")

    user = session.exec(select(User).where(User.id == subject)).first()
    if not user or user.disabled:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    return {"access_token": create_access_token(user.id), "token_type": "bearer"}


@router.post("/request-reset", status_code=status.HTTP_202_ACCEPTED)
async def request_password_reset(
    payload: PasswordResetRequestPayload,
    request: Request,
    session: Session = Depends(get_session),
) -> dict[str, str]:
    record = PasswordResetRequest(
        email=payload.email,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        created_at=datetime.utcnow(),
    )
    session.add(record)

    user = session.exec(select(User).where(User.email == payload.email)).first()
    debug_token: str | None = None
    email_status = "skipped"
    if user:
        raw_token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.password_reset_expire_minutes)
        token = PasswordResetToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=expires_at,
        )
        session.add(token)
        if settings.env != "production":
            debug_token = raw_token

        if smtp_configured():
            reset_link = f"{settings.frontend_url.rstrip('/')}/login?reset={raw_token}"
            body = (
                "You requested a Phill password reset.\n\n"
                f"Token: {raw_token}\n"
                f"Reset link: {reset_link}\n\n"
                f"The link expires in {settings.password_reset_expire_minutes} minutes. If you did not request this, you can ignore it."
            )
            try:  # pragma: no cover - requires smtp backend
                await send_plain_email(user.email, "Phill password reset", body)
                email_status = "sent"
            except Exception as exc:  # pragma: no cover - network dependent
                logger.warning("Failed to send reset email: %s", exc)
                email_status = "error"
        else:
            email_status = "smtp_unconfigured"

    session.commit()
    response: dict[str, str] = {"status": "accepted", "email_status": email_status}
    if debug_token:
        response["debug_token"] = debug_token
    return response


@router.post("/request-access", status_code=status.HTTP_202_ACCEPTED)
async def request_access(
    payload: AccessRequestPayload,
    request: Request,
    session: Session = Depends(get_session),
) -> dict[str, str]:
    record = AccessRequest(
        email=payload.email,
        note=payload.note,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        created_at=datetime.utcnow(),
    )
    session.add(record)
    session.commit()

    email_status = "skipped"
    if smtp_configured():
        subject = "Access request received"
        body = (
            "We received your request to access Phill."
            "\nWe'll review it shortly and follow up."
        )
        notify = settings.smtp_from or settings.smtp_user
        try:  # pragma: no cover - requires smtp backend
            await send_plain_email(payload.email, subject, body)
            email_status = "sent"

            if notify and notify != payload.email:
                await send_plain_email(
                    notify,
                    "New Phill access request",
                    f"Request from {payload.email}\nNote: {payload.note or 'N/A'}",
                )
        except Exception as exc:  # pragma: no cover - network dependent
            logger.warning("Failed to send access request email: %s", exc)
            email_status = "error"
    else:
        email_status = "smtp_unconfigured"

    return {"status": "accepted", "email_status": email_status}


@router.post("/confirm-reset")
def confirm_password_reset(
    payload: ConfirmResetPayload, session: Session = Depends(get_session)
) -> dict[str, str]:
    token_hash = hashlib.sha256(payload.token.encode()).hexdigest()
    now = datetime.now(timezone.utc)
    token = session.exec(
        select(PasswordResetToken)
        .where(PasswordResetToken.token_hash == token_hash)
        .where(PasswordResetToken.used_at.is_(None))
        .where(PasswordResetToken.expires_at >= now)
    ).first()

    if not token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired token")

    user = session.exec(select(User).where(User.id == token.user_id)).first()
    if not user or user.disabled:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired token")

    user.password_hash = hash_password(payload.new_password)
    token.used_at = now
    session.add(user)
    session.add(token)
    session.commit()
    return {"status": "reset"}
