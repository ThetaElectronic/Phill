from datetime import datetime
from uuid import uuid4

from sqlmodel import Column, DateTime, Field, SQLModel


class Incident(SQLModel, table=True):
    __tablename__ = "incidents"

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    company_id: str = Field(foreign_key="companies.id", index=True)
    user_id: str = Field(foreign_key="users.id", index=True)
    type: str
    description: str
    status: str = Field(default="open")
    created_at: datetime = Field(default_factory=datetime.utcnow, sa_column=Column(DateTime(timezone=True)))
