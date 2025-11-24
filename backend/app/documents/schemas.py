from datetime import datetime

from pydantic import BaseModel, Field


class DocumentBase(BaseModel):
    name: str = Field(..., min_length=1)
    path: str = Field(..., min_length=1)


class DocumentCreate(DocumentBase):
    pass


class DocumentRead(DocumentBase):
    id: str
    company_id: str
    uploaded_by: str
    created_at: datetime

    class Config:
        from_attributes = True
