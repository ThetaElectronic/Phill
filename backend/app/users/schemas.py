from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3)
    name: str = Field(..., min_length=1)
    role: str = Field(default="user")


class UserCreate(UserBase):
    company_id: str | None = Field(default=None, min_length=1)
    password: str = Field(..., min_length=8)


class UserRead(UserBase):
    company_id: str
    id: str
    disabled: bool
    created_at: datetime

    class Config:
        from_attributes = True
