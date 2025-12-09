from fastapi import HTTPException, status
from sqlalchemy import func
from sqlmodel import Session, select

from app.security.password import hash_password
from app.users.models import User
from app.users.schemas import PasswordSet, UserAdminUpdate, UserCreate, UserUpdate
from app.utils.email import normalize_email


def _ensure_unique(
    session: Session,
    *,
    email: str | None = None,
    username: str | None = None,
    exclude_id: str | None = None,
) -> None:
    if email:
        email_query = select(User.id).where(func.lower(User.email) == email)
        if exclude_id:
            email_query = email_query.where(User.id != exclude_id)
        if session.exec(email_query).first():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already in use")

    if username:
        username_query = select(User.id).where(User.username == username)
        if exclude_id:
            username_query = username_query.where(User.id != exclude_id)
        if session.exec(username_query).first():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already in use")


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _ensure_unique(
    session: Session,
    *,
    email: str | None = None,
    username: str | None = None,
    exclude_id: str | None = None,
) -> None:
    if email:
        email_query = select(User.id).where(User.email == email)
        if exclude_id:
            email_query = email_query.where(User.id != exclude_id)
        if session.exec(email_query).first():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already in use")

    if username:
        username_query = select(User.id).where(User.username == username)
        if exclude_id:
            username_query = username_query.where(User.id != exclude_id)
        if session.exec(username_query).first():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already in use")


def create_user(payload: UserCreate, session: Session, company_id: str) -> User:
    email = normalize_email(payload.email)
    username = (payload.username or email).strip()
    _ensure_unique(session, email=email, username=username)
    user = User(
        company_id=company_id,
        email=email,
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

    if payload.email:
        email = normalize_email(payload.email)
        if email != current_user.email:
            _ensure_unique(session, email=email, exclude_id=current_user.id)
            current_user.email = email
            changed = True

    if payload.name and payload.name != current_user.name:
        current_user.name = payload.name
        changed = True

    if payload.username and payload.username != current_user.username:
        _ensure_unique(session, username=payload.username, exclude_id=current_user.id)
        current_user.username = payload.username
        changed = True

    if changed:
        session.add(current_user)
        session.commit()
        session.refresh(current_user)

    return current_user


def set_password(target: User, payload: PasswordSet, session: Session) -> User:
    target.password_hash = hash_password(payload.password)
    session.add(target)
    session.commit()
    session.refresh(target)
    return target


def update_user_admin(
    target: User, payload: UserAdminUpdate, session: Session, *, company_id: str | None
) -> User:
    changed = False

    if payload.email:
        email = normalize_email(payload.email)
        if email != target.email:
            _ensure_unique(session, email=email, exclude_id=target.id)
            target.email = email
            changed = True

    if payload.name and payload.name != target.name:
        target.name = payload.name
        changed = True

    if payload.username and payload.username != target.username:
        _ensure_unique(session, username=payload.username, exclude_id=target.id)
        target.username = payload.username
        changed = True

    if payload.role and payload.role != target.role:
        target.role = payload.role
        changed = True

    if company_id and company_id != target.company_id:
        target.company_id = company_id
        changed = True

    if changed:
        session.add(target)
        session.commit()
        session.refresh(target)

    return target
