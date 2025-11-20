from datetime import datetime
from uuid import uuid4

from sqlmodel import Column, DateTime, Field, SQLModel


class Document(SQLModel, table=True):
    __tablename__ = "documents"

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    company_id: str = Field(foreign_key="companies.id", index=True)
    name: str
    path: str
    uploaded_by: str = Field(foreign_key="users.id")
    created_at: datetime = Field(default_factory=datetime.utcnow, sa_column=Column(DateTime(timezone=True)))
