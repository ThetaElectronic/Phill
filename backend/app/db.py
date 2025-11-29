import logging
import time
from collections.abc import Generator

from sqlalchemy.exc import OperationalError
from sqlmodel import Session, SQLModel, create_engine

from app.config import get_settings

settings = get_settings()
engine = create_engine(settings.database_url, echo=False, pool_pre_ping=True)

logger = logging.getLogger("phill.db")


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session


def create_db_and_tables(max_attempts: int = 10, wait_seconds: float = 3.0) -> None:
    """Create tables, retrying while the database starts up."""

    for attempt in range(1, max_attempts + 1):
        try:
            SQLModel.metadata.create_all(engine)
            logger.info("Database ready (attempt %s/%s)", attempt, max_attempts)
            return
        except OperationalError as exc:  # pragma: no cover - startup path
            logger.warning(
                "Database not ready (attempt %s/%s): %s", attempt, max_attempts, exc
            )
            if attempt == max_attempts:
                raise

            time.sleep(wait_seconds)
