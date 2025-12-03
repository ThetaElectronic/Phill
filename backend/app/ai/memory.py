from sqlmodel import Session

from app.ai.schemas import AiMemoryCreate
from app.ai.tables import AiMemory


def store_memory(data: AiMemoryCreate, session: Session) -> AiMemory:
    memory = AiMemory(**data.model_dump(exclude_none=True))
    session.add(memory)
    session.commit()
    session.refresh(memory)
    return memory
