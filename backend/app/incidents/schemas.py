from datetime import datetime

from pydantic import BaseModel, Field


class IncidentBase(BaseModel):
    type: str
    description: str = Field(..., min_length=3)
    status: str = Field(default="open")


class IncidentCreate(IncidentBase):
    pass


class IncidentRead(IncidentBase):
    id: str
    company_id: str
    user_id: str
    created_at: datetime

    class Config:
        from_attributes = True
