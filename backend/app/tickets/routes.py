from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.db import get_session
from app.security.dependencies import get_current_active_user
from app.tickets.models import Ticket
from app.tickets.schemas import TicketCreate, TicketRead
from app.tickets.service import create_ticket
from app.users.models import User

router = APIRouter()


@router.post("/", response_model=TicketRead)
def open_ticket(
    payload: TicketCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
) -> TicketRead:
    ticket = create_ticket(
        payload,
        session,
        company_id=current_user.company_id,
        user_id=current_user.id,
    )
    return TicketRead.model_validate(ticket)


@router.get("/", response_model=list[TicketRead])
def list_tickets(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
) -> list[TicketRead]:
    tickets = session.exec(select(Ticket).where(Ticket.company_id == current_user.company_id)).all()
    return [TicketRead.model_validate(ticket) for ticket in tickets]
