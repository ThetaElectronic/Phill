from sqlmodel import Session

from app.security.password import hash_password
from app.users.models import User
from app.users.schemas import UserCreate, UserUpdate


def create_user(payload: UserCreate, session: Session, company_id: str) -> User:
    username = payload.username or payload.email
    user = User(
        company_id=company_id,
        email=payload.email,
        username=username,
        name=payload.name,
        role=payload.role,
        password_hash=hash_password(payload.password),
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def update_profile(payload: UserUpdate, session: Session, current_user: User) -> User:
    changed = False

    if payload.name and payload.name != current_user.name:
        current_user.name = payload.name
        changed = True

    if payload.username and payload.username != current_user.username:
        current_user.username = payload.username
        changed = True

    if changed:
        session.add(current_user)
        session.commit()
        session.refresh(current_user)

    return current_user
