from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.db import get_session
from app.security.dependencies import get_current_active_user
from app.users.models import User
from app.users.schemas import UserCreate, UserRead
from app.users.service import create_user

router = APIRouter()


@router.post("/", response_model=UserRead)
def register_user(payload: UserCreate, session: Session = Depends(get_session)) -> UserRead:
    user = create_user(payload, session)
    return UserRead.model_validate(user)


@router.get("/me", response_model=UserRead)
def read_current_user(current_user: User = Depends(get_current_active_user)) -> UserRead:
    return UserRead.model_validate(current_user)


@router.get("/", response_model=list[UserRead])
def list_users(session: Session = Depends(get_session)) -> list[UserRead]:
    users = session.exec(select(User)).all()
    return [UserRead.model_validate(user) for user in users]
