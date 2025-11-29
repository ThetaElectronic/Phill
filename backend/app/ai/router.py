from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.ai.engine import run_completion
from app.ai.memory import store_memory
from app.ai.safeguards import SAFE_SYSTEM_PROMPT, apply_safeguards
from app.ai.schemas import AiMemoryCreate, ChatRequest, ChatResponse
from app.db import get_session
from app.security.dependencies import get_current_active_user
from app.users.models import User

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
def chat(
    request: ChatRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
) -> ChatResponse:
    system_prompt = request.system or SAFE_SYSTEM_PROMPT

    try:
        raw_output = run_completion(request.prompt, system_prompt)
    except RuntimeError as exc:  # pragma: no cover - network dependent
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    message = None
    choices = raw_output.get("choices") if isinstance(raw_output, dict) else None
    if isinstance(choices, list) and choices:
        message = choices[0].get("message", {}).get("content")
    reply_text = message if isinstance(message, str) else ""

    safe_output = apply_safeguards(reply_text)

    memory_company = request.company_id or current_user.company_id
    if request.company_id and request.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="Cannot write memory for another company")

    if memory_company and request.persist:
        memory = AiMemoryCreate(
            company_id=memory_company,
            data={"prompt": request.prompt, "output": safe_output, "user_id": current_user.id, "model": raw_output.get("model")},
        )
        store_memory(memory, session)

    return ChatResponse(reply=safe_output, model=raw_output.get("model"), id=raw_output.get("id"), usage=raw_output.get("usage"))
