from pydantic import BaseModel, EmailStr, Field


class LoginInput(BaseModel):
    username: str = Field(..., min_length=3)
    password: str = Field(..., min_length=8)


class EmailRequest(BaseModel):
    to: EmailStr
    subject: str = Field(..., min_length=1)
    body: str = Field(..., min_length=1)
