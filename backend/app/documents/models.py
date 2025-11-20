from datetime import datetime

from sqlmodel import Column, DateTime, Field, SQLModel


class Document(SQLModel, table=True):
    id: str | None = Field(default=None, primary_key=True)
    company_id: str = Field(index=True)
    name: str
    path: str
    uploaded_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow, sa_column=Column(DateTime(timezone=True)))
