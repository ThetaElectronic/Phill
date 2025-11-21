from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from sqlmodel import Session, select

from app.db import get_session
from app.documents.models import Document
from app.documents.schemas import DocumentCreate, DocumentRead
from app.documents.upload import LocalDocumentStore
from app.security.dependencies import get_current_active_user
from app.users.models import User

router = APIRouter()
store = LocalDocumentStore(base_dir=Path("/tmp/uploads"))


def _persist(doc: Document, session: Session) -> Document:
    session.add(doc)
    session.commit()
    session.refresh(doc)
    return doc


@router.post("/", response_model=DocumentRead)
def create_document(
    payload: DocumentCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
) -> DocumentRead:
    doc = Document(
        company_id=current_user.company_id,
        uploaded_by=current_user.id,
        name=payload.name,
        path=payload.path,
    )
    _persist(doc, session)
    return DocumentRead.model_validate(doc)


@router.post("/upload", response_model=DocumentRead)
def upload_document(
    file: UploadFile,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
) -> DocumentRead:
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File name required")
    saved_path = store.save(current_user.company_id, file.filename, file.file.read())
    doc = Document(
        company_id=current_user.company_id,
        name=file.filename,
        path=saved_path,
        uploaded_by=current_user.id,
    )
    _persist(doc, session)
    return DocumentRead.model_validate(doc)


@router.get("/", response_model=list[DocumentRead])
def list_documents(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
) -> list[DocumentRead]:
    docs = session.exec(select(Document).where(Document.company_id == current_user.company_id)).all()
    return [DocumentRead.model_validate(doc) for doc in docs]
