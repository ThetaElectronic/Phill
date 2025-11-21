from datetime import datetime

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    prompt: str = Field(..., min_length=1)
    system: str | None = None
    company_id: str | None = None
    user_id: str | None = None


class ChatResponse(BaseModel):
    output: dict


class AiMemoryCreate(BaseModel):
    company_id: str
    data: dict
    created_at: datetime | None = None
