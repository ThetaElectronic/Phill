from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.db import get_session
from app.security.dependencies import get_current_active_user, require_role
from app.users.models import User
from app.users.schemas import UserCreate, UserRead
from app.users.service import create_user
from app.users.permissions import ROLE_MANAGER, ROLE_FOUNDER, has_role

router = APIRouter()


@router.post("/", response_model=UserRead)
def register_user(
    payload: UserCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_role(ROLE_MANAGER)),
) -> UserRead:
    target_company_id = (
        payload.company_id if has_role(current_user.role, ROLE_FOUNDER) and payload.company_id else current_user.company_id
    )

    if not has_role(current_user.role, payload.role):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot assign higher role than your own")

    user = create_user(payload, session, company_id=target_company_id)
    return UserRead.model_validate(user)


@router.get("/me", response_model=UserRead)
def read_current_user(current_user: User = Depends(get_current_active_user)) -> UserRead:
    return UserRead.model_validate(current_user)


@router.get("/", response_model=list[UserRead])
def list_users(
    session: Session = Depends(get_session), current_user: User = Depends(require_role(ROLE_MANAGER))
) -> list[UserRead]:
    query = select(User)
    if not has_role(current_user.role, ROLE_FOUNDER):
        query = query.where(User.company_id == current_user.company_id)

    users = session.exec(query).all()
    return [UserRead.model_validate(user) for user in users]
