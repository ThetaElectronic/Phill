from sqlmodel import Session

from app.tickets.models import Ticket
from app.tickets.schemas import TicketCreate


def create_ticket(payload: TicketCreate, session: Session) -> Ticket:
    ticket = Ticket(**payload.model_dump())
    session.add(ticket)
    session.commit()
    session.refresh(ticket)
    return ticket
