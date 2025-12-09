from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.companies.models import Company
from app.db import get_session
from app.security.dependencies import get_current_active_user, require_role
from app.users.models import User
from app.users.schemas import (
    PasswordChange,
    PasswordSet,
    UserAdminUpdate,
    UserCreate,
    UserRead,
    UserUpdate,
)
from app.users.service import create_user, set_password, update_profile, update_user_admin
from app.users.permissions import ROLE_MANAGER, ROLE_FOUNDER, has_role
from app.security.password import hash_password, verify_password

router = APIRouter()


def _company_names(session: Session, company_ids: set[str]) -> dict[str, str]:
    if not company_ids:
        return {}
    rows = session.exec(select(Company).where(Company.id.in_(company_ids))).all()
    return {row.id: row.name for row in rows}


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
    company_names = _company_names(session, {user.company_id})
    user.company_name = company_names.get(user.company_id)
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
    company_ids = {user.company_id for user in users}
    company_names = _company_names(session, company_ids)
    for user in users:
        user.company_name = company_names.get(user.company_id)

    return [UserRead.model_validate(user) for user in users]


@router.post("/{user_id}/password", status_code=status.HTTP_204_NO_CONTENT)
def set_user_password(
    user_id: str,
    payload: PasswordSet,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_role(ROLE_MANAGER)),
) -> None:
    target = session.get(User, user_id)
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if not has_role(current_user.role, target.role):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot update a higher role")

    if not has_role(current_user.role, ROLE_FOUNDER) and target.company_id != current_user.company_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is outside your company")

    set_password(target, payload, session)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_role(ROLE_MANAGER)),
) -> None:
    target = session.get(User, user_id)
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if not has_role(current_user.role, target.role):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot delete a higher role")

    if not has_role(current_user.role, ROLE_FOUNDER) and target.company_id != current_user.company_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is outside your company")

    session.delete(target)
    session.commit()


@router.patch("/{user_id}", response_model=UserRead)
def update_user(
    user_id: str,
    payload: UserAdminUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_role(ROLE_MANAGER)),
) -> UserRead:
    target = session.get(User, user_id)
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Cannot manage higher roles
    if not has_role(current_user.role, target.role):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot manage a higher role")

    # Role elevation is limited to the acting admin's level
    if payload.role and not has_role(current_user.role, payload.role):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot assign higher role than your own")

    # Company scoping
    target_company = target.company_id
    if has_role(current_user.role, ROLE_FOUNDER):
        target_company = payload.company_id or target_company
    elif payload.company_id and payload.company_id != target.company_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot move users to another company")
    elif target.company_id != current_user.company_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is outside your company")

    updated = update_user_admin(target, payload, session, company_id=target_company)
    company_names = _company_names(session, {updated.company_id})
    updated.company_name = company_names.get(updated.company_id)
    return UserRead.model_validate(updated)


@router.patch("/me", response_model=UserRead)
def update_current_user(
    payload: UserUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
) -> UserRead:
    user = update_profile(payload, session, current_user=current_user)
    company_names = _company_names(session, {user.company_id})
    user.company_name = company_names.get(user.company_id)
    return UserRead.model_validate(user)


@router.post("/me/password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(
    payload: PasswordChange,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
) -> None:
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Current password is incorrect")

    current_user.password_hash = hash_password(payload.new_password)
    session.add(current_user)
    session.commit()
