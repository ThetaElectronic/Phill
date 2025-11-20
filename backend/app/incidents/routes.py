from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.db import get_session
from app.incidents.audit import audit_entry
from app.incidents.models import Incident
from app.incidents.schemas import IncidentCreate, IncidentRead
from app.incidents.workflow import escalate_status

router = APIRouter()


def _persist(session: Session, incident: Incident) -> Incident:
    session.add(incident)
    session.commit()
    session.refresh(incident)
    return incident


@router.post("/", response_model=IncidentRead)
def create_incident(payload: IncidentCreate, session: Session = Depends(get_session)) -> IncidentRead:
    incident = Incident(**payload.model_dump())
    _persist(session, incident)
    return IncidentRead.model_validate(incident)


@router.post("/{incident_id}/escalate", response_model=IncidentRead)
def escalate_incident(incident_id: str, session: Session = Depends(get_session)) -> IncidentRead:
    incident = session.get(Incident, incident_id)
    if not incident:
        raise ValueError("Incident not found")
    incident.status = escalate_status(incident.status)
    _persist(session, incident)
    audit_entry("escalate", incident.user_id, incident_id)
    return IncidentRead.model_validate(incident)


@router.get("/", response_model=list[IncidentRead])
def list_incidents(session: Session = Depends(get_session)) -> list[IncidentRead]:
    incidents = session.exec(select(Incident)).all()
    return [IncidentRead.model_validate(item) for item in incidents]
