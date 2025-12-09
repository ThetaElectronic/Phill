import io
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from pypdf import PdfReader
from sqlmodel import Session, select

from app.ai.engine import ai_configuration, run_completion
from app.ai.memory import store_memory
from app.ai.safeguards import SAFE_SYSTEM_PROMPT, apply_safeguards
from app.ai.schemas import (
    AiMemoryCreate,
    ChatRequest,
    ChatResponse,
    DocumentPayload,
    DocumentScopeUpdate,
)
from app.db import get_session
from app.security.dependencies import get_current_active_user
from app.users.models import User
from app.users.permissions import ROLE_FOUNDER, has_role
from app.ai.tables import AiMemory
from app.config import get_settings
from app.companies.models import Company

router = APIRouter()


def _resolve_company_ids(
    requested: list[str] | None,
    fallback: str | None,
    current_user: User,
) -> list[str]:
    requested_ids = [value.strip() for value in (requested or []) if value and value.strip()]

    if requested_ids and not has_role(current_user.role, ROLE_FOUNDER):
        if current_user.company_id not in requested_ids:
            raise HTTPException(status_code=403, detail="Cannot act on another company")
        return [current_user.company_id]

    target_company = fallback or current_user.company_id
    if not target_company and not requested_ids:
        raise HTTPException(status_code=400, detail="User is not linked to a company")

    if requested_ids and not has_role(current_user.role, ROLE_FOUNDER):
        raise HTTPException(status_code=403, detail="Cannot act on another company")

    if not requested_ids:
        return [target_company]

    return sorted(set(requested_ids))


def _resolve_company_id(requested: str | None, current_user: User) -> str:
    return _resolve_company_ids([requested] if requested else [], requested, current_user)[0]


def _company_names(session: Session, company_ids: set[str]) -> dict[str, str]:
    if not company_ids:
        return {}
    rows = session.exec(select(Company).where(Company.id.in_(company_ids))).all()
    return {row.id: row.name for row in rows}


@router.get("/status")
def ai_status() -> dict[str, Any]:
    """Expose AI configuration readiness for the UI."""

    status = ai_configuration()
    status["checked_at"] = datetime.now(timezone.utc).isoformat()
    return status


@router.post("/chat", response_model=ChatResponse)
def chat(
    request: ChatRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
) -> ChatResponse:
    settings = get_settings()
    system_prompt = request.system or SAFE_SYSTEM_PROMPT

    prompt = request.prompt
    document_ids = []

    if request.document_ids:
        seen: set[str] = set()
        for doc_id in request.document_ids:
            if doc_id in seen:
                continue
            seen.add(doc_id)
            document_ids.append(doc_id)

        documents = _load_documents(document_ids, current_user, session)
        document_sections = []
        for doc in documents:
            text = doc.get("text") or doc.get("excerpt") or ""
            filename = doc.get("filename") or "document"
            document_sections.append(f"Document: {filename}\n{text}")
        prompt = "Use the provided documents to answer.\n\n" + "\n\n".join(document_sections) + f"\n\nUser question: {request.prompt}"

    try:
        raw_output = run_completion(prompt, system_prompt)
    except RuntimeError as exc:  # pragma: no cover - network dependent
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    message = None
    choices = raw_output.get("choices") if isinstance(raw_output, dict) else None
    if isinstance(choices, list) and choices:
        message = choices[0].get("message", {}).get("content")
    reply_text = message if isinstance(message, str) else ""

    safe_output = apply_safeguards(reply_text)

    memory_company = _resolve_company_id(request.company_id, current_user)

    if memory_company and request.persist:
        memory = AiMemoryCreate(
            company_id=memory_company,
            data={
                "type": "chat",
                "scope": request.memory_scope or "personal",
                "prompt": request.prompt,
                "output": safe_output,
                "user_id": current_user.id,
                "model": raw_output.get("model"),
            },
        )
        store_memory(memory, session)

    return ChatResponse(reply=safe_output, model=raw_output.get("model"), id=raw_output.get("id"), usage=raw_output.get("usage"))


@router.post("/documents", response_model=list[DocumentPayload])
async def upload_documents(
    files: list[UploadFile] | None = File(default=None, alias="files"),
    file: UploadFile | None = File(default=None, alias="file"),
    scope: str | None = Form(default="company"),
    scopes: list[str] | None = Form(default=None, alias="scopes"),
    company_id: str | None = Form(default=None),
    company_ids: list[str] | None = Form(default=None, alias="company_ids"),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
) -> list[DocumentPayload]:
    target_companies = _resolve_company_ids(company_ids, company_id, current_user)

    upload_batch: list[UploadFile] = []
    if files:
        upload_batch.extend(files)
    if file:
        upload_batch.append(file)

    if not upload_batch:
        raise HTTPException(status_code=400, detail="No files provided")

    resolved_scopes: list[str] = []
    if scopes:
        resolved_scopes = [(value or "company").strip().lower() for value in scopes]
        if len(resolved_scopes) not in {0, len(upload_batch)}:
            raise HTTPException(status_code=400, detail="Scope count does not match file count")

    default_scope = (scope or "company").strip().lower()
    documents: list[DocumentPayload] = []
    settings = get_settings()
    max_size = int(settings.ai_document_max_bytes or 512_000)
    max_text = int(settings.ai_document_max_text or 20_000)
    company_names = _company_names(session, set(target_companies))

    for idx, upload in enumerate(upload_batch):
        target_scope = resolved_scopes[idx] if resolved_scopes else default_scope
        if target_scope not in {"company", "global"}:
            raise HTTPException(status_code=400, detail="Invalid scope")

        raw_bytes = await upload.read()
        if not raw_bytes:
            raise HTTPException(status_code=400, detail=f"{upload.filename or 'File'} is empty")

        if len(raw_bytes) > max_size:
            raise HTTPException(status_code=413, detail=f"{upload.filename or 'File'} is too large (max {max_size} bytes)")

        text = _extract_text(upload.filename or "", upload.content_type or "", raw_bytes)
        trimmed_text = (text or "").strip()[:max_text]
        excerpt = trimmed_text[:300]

        for company in target_companies:
            memory = AiMemoryCreate(
                company_id=company,
                data={
                    "type": "document",
                    "scope": target_scope,
                    "filename": upload.filename,
                    "content_type": upload.content_type,
                    "size": len(raw_bytes),
                    "text": trimmed_text,
                    "excerpt": excerpt,
                },
            )
            record = _store_memory(memory, session)
            documents.append(_document_payload(record, company_names))

    return documents


@router.get("/documents", response_model=list[DocumentPayload])
def list_documents(
    company_id: str | None = Query(default=None),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
) -> list[DocumentPayload]:
    if not current_user.company_id and not has_role(current_user.role, ROLE_FOUNDER):
        raise HTTPException(status_code=400, detail="User is not linked to a company")

    target_company = company_id if has_role(current_user.role, ROLE_FOUNDER) else current_user.company_id
    records = session.exec(select(AiMemory).order_by(AiMemory.created_at.desc())).all()

    visible: list[AiMemory] = []
    for record in records:
        data: dict[str, Any] = record.data or {}
        if data.get("type") != "document":
            continue
        scope = data.get("scope") or "company"

        if has_role(current_user.role, ROLE_FOUNDER):
            if target_company and record.company_id != target_company and scope != "global":
                continue
        elif record.company_id != current_user.company_id and scope != "global":
            continue

        visible.append(record)

    company_names = _company_names(session, {record.company_id for record in visible})
    return [_document_payload(record, company_names) for record in visible]


@router.delete("/documents/{document_id}", status_code=204)
def delete_document(
    document_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
) -> None:
    record = session.get(AiMemory, document_id)
    if not record:
        raise HTTPException(status_code=404, detail="Document not found")
    if record.company_id != current_user.company_id and not has_role(current_user.role, ROLE_FOUNDER):
        raise HTTPException(status_code=404, detail="Document not found")

    data: dict[str, Any] = record.data or {}
    if data.get("type") != "document":
        raise HTTPException(status_code=404, detail="Document not found")

    session.delete(record)
    session.commit()


@router.patch("/documents/{document_id}", response_model=DocumentPayload)
def update_document_scope(
    document_id: str,
    payload: DocumentScopeUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
) -> DocumentPayload:
    record = session.get(AiMemory, document_id)
    if not record:
        raise HTTPException(status_code=404, detail="Document not found")
    if record.company_id != current_user.company_id and not has_role(current_user.role, ROLE_FOUNDER):
        raise HTTPException(status_code=404, detail="Document not found")

    data: dict[str, Any] = record.data or {}
    if data.get("type") != "document":
        raise HTTPException(status_code=404, detail="Document not found")

    scope = (payload.scope or "company").strip().lower()
    if scope not in {"company", "global"}:
        raise HTTPException(status_code=400, detail="Invalid scope")

    data["scope"] = scope
    record.data = data
    session.add(record)
    session.commit()
    session.refresh(record)

    company_names = _company_names(session, {record.company_id})
    return _document_payload(record, company_names)


def _store_memory(payload: AiMemoryCreate, session: Session) -> AiMemory:
    memory = AiMemory(**payload.model_dump(exclude_none=True))
    session.add(memory)
    session.commit()
    session.refresh(memory)
    return memory


def _document_payload(record: AiMemory, company_names: dict[str, str] | None = None) -> DocumentPayload:
    data: dict[str, Any] = record.data or {}
    scope = data.get("scope") or "company"
    excerpt = data.get("excerpt") or (data.get("text") or "")[:300]
    created_at = record.created_at
    if created_at is None:
        created_at = datetime.utcnow()

    return DocumentPayload(
        id=record.id,
        filename=data.get("filename") or "document",
        content_type=data.get("content_type"),
        size=int(data.get("size") or 0),
        created_at=created_at,
        excerpt=excerpt,
        text=data.get("text"),
        scope=scope,
        owner_company_id=record.company_id,
        owner_company_name=(company_names or {}).get(record.company_id),
    )


def _extract_text(filename: str, content_type: str, raw_bytes: bytes) -> str:
    lowered_name = filename.lower()
    lowered_type = content_type.lower()

    if "pdf" in lowered_name or lowered_type == "application/pdf":
        if not PdfReader:
            raise HTTPException(status_code=500, detail="PDF support is not available")
        try:
            pdf = PdfReader(io.BytesIO(raw_bytes))
            text_chunks = [page.extract_text() or "" for page in pdf.pages]
            return "\n".join(text_chunks).strip()
        except Exception as exc:  # pragma: no cover - external library
            raise HTTPException(status_code=400, detail=f"Could not read PDF: {exc}") from exc

    binary_types = (
        "image/",
        "video/",
        "audio/",
        "application/octet-stream",
        "application/zip",
        "application/vnd",
        "application/msword",
        "application/vnd.openxmlformats-officedocument",
    )

    if any(lowered_type.startswith(prefix) for prefix in binary_types):
        return ""

    if any(lowered_name.endswith(ext) for ext in [".ppt", ".pptx", ".xls", ".xlsx", ".csv", ".png", ".jpg", ".jpeg", ".gif", ".bmp"]):
        return ""

    try:
        return raw_bytes.decode("utf-8")
    except UnicodeDecodeError:
        return raw_bytes.decode("latin-1", errors="replace")


def _load_documents(ids: list[str], current_user: User, session: Session) -> list[dict[str, Any]]:
    documents: list[dict[str, Any]] = []

    for doc_id in ids:
        record = session.get(AiMemory, doc_id)
        if not record:
            raise HTTPException(status_code=404, detail="Document not found")

        data: dict[str, Any] = record.data or {}
        if data.get("type") != "document":
            raise HTTPException(status_code=400, detail="Referenced record is not a document")
        scope = data.get("scope") or "company"
        if record.company_id != current_user.company_id and scope != "global" and not has_role(
            current_user.role, ROLE_FOUNDER
        ):
            raise HTTPException(status_code=403, detail="Cannot use another company's documents")

        documents.append(data)

    if len(documents) != len(ids):
        raise HTTPException(status_code=404, detail="One or more documents were not found")

    return documents
