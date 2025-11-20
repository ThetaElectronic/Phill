from sqlmodel import Session

from app.security.password import hash_password
from app.users.models import User
from app.users.schemas import UserCreate


def create_user(payload: UserCreate, session: Session) -> User:
    user = User(
        company_id=payload.company_id,
        email=payload.email,
        username=payload.username,
        name=payload.name,
        role=payload.role,
        password_hash=hash_password(payload.password),
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user
