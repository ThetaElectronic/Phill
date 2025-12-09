from datetime import datetime

from typing import Literal

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    prompt: str = Field(..., min_length=1)
    system: str | None = None
    company_id: str | None = None
    user_id: str | None = None
    persist: bool = False
    memory_scope: Literal["personal", "company"] = "personal"
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
    created_at: datetime | None = None
    excerpt: str | None = None
    text: str | None = None
    scope: Literal["company", "global"] = "company"
    owner_company_id: str | None = None
    owner_company_name: str | None = None


class DocumentScopeUpdate(BaseModel):
    scope: Literal["company", "global"]


class AiMemoryCreate(BaseModel):
    company_id: str
    data: dict
    created_at: datetime | None = None
