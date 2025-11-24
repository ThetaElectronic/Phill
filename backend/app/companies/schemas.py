from datetime import datetime

from pydantic import BaseModel, Field


class CompanyBase(BaseModel):
    name: str = Field(..., min_length=1)
    domain: str = Field(..., min_length=3)
    settings: dict | None = None


class CompanyCreate(CompanyBase):
    pass


class CompanyRead(CompanyBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True
