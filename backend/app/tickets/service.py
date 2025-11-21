from sqlmodel import Session

from app.tickets.models import Ticket
from app.tickets.schemas import TicketCreate


def create_ticket(payload: TicketCreate, session: Session, *, company_id: str, user_id: str) -> Ticket:
    ticket = Ticket(company_id=company_id, user_id=user_id, **payload.model_dump())
    session.add(ticket)
    session.commit()
    session.refresh(ticket)
    return ticket
