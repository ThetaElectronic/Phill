from datetime import datetime
from uuid import uuid4

from sqlmodel import Column, DateTime, Field, SQLModel


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    company_id: str = Field(foreign_key="companies.id", index=True)
    email: str = Field(index=True, unique=True)
    username: str = Field(index=True, unique=True)
    name: str
    role: str = Field(default="user")
    password_hash: str
    disabled: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow, sa_column=Column(DateTime(timezone=True)))
