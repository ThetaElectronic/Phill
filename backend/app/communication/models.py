from datetime import datetime

from sqlmodel import Field, SQLModel


class EmailTemplate(SQLModel, table=True):
    key: str = Field(primary_key=True, index=True)
    subject: str
    body: str
    updated_at: datetime = Field(default_factory=datetime.utcnow)
