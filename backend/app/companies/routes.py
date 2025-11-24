from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.companies.models import Company
from app.companies.schemas import CompanyCreate, CompanyRead
from app.companies.service import create_company
from app.db import get_session
from app.security.dependencies import require_role
from app.users.permissions import ROLE_FOUNDER

router = APIRouter()


@router.post("/", response_model=CompanyRead)
def register_company(
    payload: CompanyCreate,
    session: Session = Depends(get_session),
    current_user=Depends(require_role(ROLE_FOUNDER)),
) -> CompanyRead:
    company = create_company(payload, session)
    return CompanyRead.model_validate(company)


@router.get("/", response_model=list[CompanyRead])
def list_companies(
    session: Session = Depends(get_session), current_user=Depends(require_role(ROLE_FOUNDER))
) -> list[CompanyRead]:
    companies = session.exec(select(Company)).all()
    if not companies:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No companies found")
    return [CompanyRead.model_validate(company) for company in companies]
