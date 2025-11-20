from datetime import datetime

from sqlmodel import Column, DateTime, Field, JSON, SQLModel


class AiMemory(SQLModel, table=True):
    id: str | None = Field(default=None, primary_key=True)
    company_id: str = Field(index=True)
    data: dict = Field(sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow, sa_column=Column(DateTime(timezone=True)))
