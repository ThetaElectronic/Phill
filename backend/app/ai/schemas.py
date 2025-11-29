from datetime import datetime

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    prompt: str = Field(..., min_length=1)
    system: str | None = None
    company_id: str | None = None
    user_id: str | None = None
    persist: bool = False


class ChatResponse(BaseModel):
    reply: str
    model: str | None = None
    id: str | None = None
    usage: dict | None = None


class AiMemoryCreate(BaseModel):
    company_id: str
    data: dict
    created_at: datetime | None = None
