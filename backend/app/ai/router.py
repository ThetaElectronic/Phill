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
    raw_output = run_completion(request.prompt, system_prompt)
    safe_output = apply_safeguards(raw_output)

    memory_company = request.company_id or current_user.company_id
    if request.company_id and request.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="Cannot write memory for another company")

    if memory_company:
        memory = AiMemoryCreate(
            company_id=memory_company, data={"prompt": request.prompt, "output": safe_output, "user_id": current_user.id}
        )
        store_memory(memory, session)

    return ChatResponse(output=safe_output)
