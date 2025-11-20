from fastapi import APIRouter, Depends, UploadFile
from sqlmodel import Session, select

from app.db import get_session
from app.documents.models import Document
from app.documents.schemas import DocumentCreate, DocumentRead
from app.documents.upload import LocalDocumentStore

router = APIRouter()
store = LocalDocumentStore(base_dir=__import__("pathlib").Path("/tmp/uploads"))


def _persist(doc: Document, session: Session) -> Document:
    session.add(doc)
    session.commit()
    session.refresh(doc)
    return doc


@router.post("/", response_model=DocumentRead)
def create_document(payload: DocumentCreate, session: Session = Depends(get_session)) -> DocumentRead:
    doc = Document(**payload.model_dump())
    _persist(doc, session)
    return DocumentRead.model_validate(doc)


@router.post("/upload", response_model=DocumentRead)
def upload_document(
    company_id: str,
    uploaded_by: str,
    file: UploadFile,
    session: Session = Depends(get_session),
) -> DocumentRead:
    saved_path = store.save(company_id, file.filename, file.file.read())
    doc = Document(company_id=company_id, name=file.filename, path=saved_path, uploaded_by=uploaded_by)
    _persist(doc, session)
    return DocumentRead.model_validate(doc)


@router.get("/", response_model=list[DocumentRead])
def list_documents(session: Session = Depends(get_session)) -> list[DocumentRead]:
    docs = session.exec(select(Document)).all()
    return [DocumentRead.model_validate(doc) for doc in docs]
