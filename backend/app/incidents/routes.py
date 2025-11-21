from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.db import get_session
from app.incidents.audit import audit_entry
from app.incidents.models import Incident
from app.incidents.schemas import IncidentCreate, IncidentRead
from app.incidents.workflow import escalate_status
from app.security.dependencies import get_current_active_user
from app.users.models import User
from app.users.permissions import ROLE_SUPERVISOR, has_role

router = APIRouter()


def _persist(session: Session, incident: Incident) -> Incident:
    session.add(incident)
    session.commit()
    session.refresh(incident)
    return incident


@router.post("/", response_model=IncidentRead)
def create_incident(
    payload: IncidentCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
) -> IncidentRead:
    incident = Incident(
        company_id=current_user.company_id,
        user_id=current_user.id,
        type=payload.type,
        description=payload.description,
        status=payload.status,
    )
    _persist(session, incident)
    return IncidentRead.model_validate(incident)


@router.post("/{incident_id}/escalate", response_model=IncidentRead)
def escalate_incident(
    incident_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
) -> IncidentRead:
    if not has_role(current_user.role, ROLE_SUPERVISOR):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient role to escalate")
    incident = session.get(Incident, incident_id)
    if not incident or incident.company_id != current_user.company_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found")
    incident.status = escalate_status(incident.status)
    _persist(session, incident)
    audit_entry("escalate", incident.user_id, incident_id)
    return IncidentRead.model_validate(incident)


@router.get("/", response_model=list[IncidentRead])
def list_incidents(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
) -> list[IncidentRead]:
    query = select(Incident).where(Incident.company_id == current_user.company_id)
    if not has_role(current_user.role, ROLE_SUPERVISOR):
        query = query.where(Incident.user_id == current_user.id)

    incidents = session.exec(query).all()
    return [IncidentRead.model_validate(item) for item in incidents]
