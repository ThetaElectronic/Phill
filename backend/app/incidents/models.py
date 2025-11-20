from datetime import datetime

from sqlmodel import Column, DateTime, Field, SQLModel


class Incident(SQLModel, table=True):
    id: str | None = Field(default=None, primary_key=True)
    company_id: str = Field(index=True)
    user_id: str = Field(index=True)
    type: str
    description: str
    status: str = Field(default="open")
    created_at: datetime = Field(default_factory=datetime.utcnow, sa_column=Column(DateTime(timezone=True)))
