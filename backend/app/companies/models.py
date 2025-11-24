from datetime import datetime
from uuid import uuid4

from sqlmodel import Column, DateTime, Field, JSON, SQLModel


class Company(SQLModel, table=True):
    __tablename__ = "companies"

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    name: str = Field(index=True)
    domain: str = Field(index=True, unique=True)
    settings: dict | None = Field(default=None, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow, sa_column=Column(DateTime(timezone=True)))
