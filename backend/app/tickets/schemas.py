from datetime import datetime

from pydantic import BaseModel, Field


class TicketBase(BaseModel):
    company_id: str
    user_id: str
    subject: str = Field(..., min_length=1)
    message: str = Field(..., min_length=1)
    status: str = Field(default="open")


class TicketCreate(TicketBase):
    pass


class TicketRead(TicketBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True
