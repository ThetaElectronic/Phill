from datetime import datetime

from fastapi import APIRouter, Body, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from sqlalchemy import or_
from sqlmodel import Session, select

from app.db import get_session
from app.security.password import verify_password
from app.security.tokens import TokenType, create_access_token, create_refresh_token, decode_token
from app.users.models import AccessRequest, PasswordResetRequest, User

router = APIRouter()


class PasswordResetRequestPayload(BaseModel):
    email: EmailStr


class AccessRequestPayload(BaseModel):
    email: EmailStr
    note: str | None = None


@router.post("/token")
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)
) -> dict[str, str]:
    # Accept either email or username for authentication; emails are the primary login field.
    identifier = form_data.username
    user = session.exec(
        select(User).where(or_(User.username == identifier, User.email == identifier))
    ).first()
    if not user or not verify_password(form_data.password, user.password_hash) or user.disabled:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect credentials")

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
def request_password_reset(
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
    session.commit()
    return {"status": "accepted"}


@router.post("/request-access", status_code=status.HTTP_202_ACCEPTED)
def request_access(
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
    return {"status": "accepted"}
