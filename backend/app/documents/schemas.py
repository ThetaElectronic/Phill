from datetime import datetime

from pydantic import BaseModel, Field


class DocumentBase(BaseModel):
    company_id: str
    name: str = Field(..., min_length=1)
    path: str = Field(..., min_length=1)
    uploaded_by: str


class DocumentCreate(DocumentBase):
    pass


class DocumentRead(DocumentBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True
