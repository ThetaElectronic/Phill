from datetime import datetime

from pydantic import BaseModel, Field


class TicketBase(BaseModel):
    subject: str = Field(..., min_length=1)
    message: str = Field(..., min_length=1)
    status: str = Field(default="open")


class TicketCreate(TicketBase):
    pass


class TicketRead(TicketBase):
    id: str
    company_id: str
    user_id: str
    created_at: datetime

    class Config:
        from_attributes = True
