from datetime import datetime

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, EmailStr
from sqlmodel import Session, select

from app.admin.system_checks import system_status
from app.db import get_session
from app.security.dependencies import require_role
from app.users.permissions import ROLE_ADMIN
from app.users.models import AccessRequest, PasswordResetRequest

router = APIRouter()


@router.get("/status")
def get_status(current_user=Depends(require_role(ROLE_ADMIN))) -> dict[str, str]:
    return system_status()


class AccessRequestRead(BaseModel):
    id: str
    email: EmailStr
    note: str | None = None
    ip_address: str | None = None
    user_agent: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class PasswordResetRequestRead(BaseModel):
    id: str
    email: EmailStr
    ip_address: str | None = None
    user_agent: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


@router.get("/requests/access", response_model=list[AccessRequestRead])
def list_access_requests(
    limit: int = Query(50, ge=1, le=200),
    session: Session = Depends(get_session),
    current_user=Depends(require_role(ROLE_ADMIN)),
):
    return session.exec(
        select(AccessRequest).order_by(AccessRequest.created_at.desc()).limit(limit)
    ).all()


@router.get("/requests/password-resets", response_model=list[PasswordResetRequestRead])
def list_password_reset_requests(
    limit: int = Query(50, ge=1, le=200),
    session: Session = Depends(get_session),
    current_user=Depends(require_role(ROLE_ADMIN)),
):
    return session.exec(
        select(PasswordResetRequest)
        .order_by(PasswordResetRequest.created_at.desc())
        .limit(limit)
    ).all()
