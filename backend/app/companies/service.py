from sqlmodel import Session

from app.companies.models import Company
from app.companies.schemas import CompanyCreate


def create_company(payload: CompanyCreate, session: Session) -> Company:
    company = Company(**payload.model_dump())
    session.add(company)
    session.commit()
    session.refresh(company)
    return company
