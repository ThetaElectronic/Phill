from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.companies.models import Company
from app.companies.schemas import CompanyCreate, CompanyRead
from app.companies.service import create_company
from app.db import get_session

router = APIRouter()


@router.post("/", response_model=CompanyRead)
def register_company(payload: CompanyCreate, session: Session = Depends(get_session)) -> CompanyRead:
    company = create_company(payload, session)
    return CompanyRead.model_validate(company)


@router.get("/", response_model=list[CompanyRead])
def list_companies(session: Session = Depends(get_session)) -> list[CompanyRead]:
    companies = session.exec(select(Company)).all()
    return [CompanyRead.model_validate(company) for company in companies]
