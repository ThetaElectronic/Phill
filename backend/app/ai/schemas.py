from datetime import datetime

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    prompt: str = Field(..., min_length=1)
    system: str | None = None
    company_id: str | None = None
    user_id: str | None = None
    persist: bool = False
    document_ids: list[str] = Field(default_factory=list)


class ChatResponse(BaseModel):
    reply: str
    model: str | None = None
    id: str | None = None
    usage: dict | None = None


class DocumentPayload(BaseModel):
    id: str
    filename: str
    content_type: str | None = None
    size: int
    created_at: datetime
    excerpt: str | None = None


class AiMemoryCreate(BaseModel):
    company_id: str
    data: dict
    created_at: datetime | None = None
