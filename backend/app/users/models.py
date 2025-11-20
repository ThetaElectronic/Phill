from datetime import datetime

from sqlmodel import Column, DateTime, Field, SQLModel


class User(SQLModel, table=True):
    id: str | None = Field(default=None, primary_key=True)
    company_id: str = Field(index=True)
    email: str = Field(index=True, unique=True)
    username: str = Field(index=True, unique=True)
    name: str
    role: str = Field(default="user")
    password_hash: str
    disabled: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow, sa_column=Column(DateTime(timezone=True)))
