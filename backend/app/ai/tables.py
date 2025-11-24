from datetime import datetime
from uuid import uuid4

from sqlmodel import Column, DateTime, Field, JSON, SQLModel


class AiMemory(SQLModel, table=True):
    __tablename__ = "ai_memory"

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    company_id: str = Field(foreign_key="companies.id", index=True)
    data: dict = Field(sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow, sa_column=Column(DateTime(timezone=True)))
