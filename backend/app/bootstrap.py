"""Startup helpers for seeding core access."""

from __future__ import annotations

import logging
import os
from uuid import uuid4

from sqlmodel import Session, select

from app.companies.models import Company
from app.db import engine
from app.security.password import hash_password
from app.users.models import User
from app.users.permissions import ROLE_FOUNDER

logger = logging.getLogger(__name__)


def _env_flag(name: str, default: str = "true") -> bool:
    return os.getenv(name, default).lower() not in {"0", "false", "no"}


def _get_env(*keys: str) -> str | None:
    for key in keys:
        value = os.getenv(key)
        if value:
            return value
    return None


def bootstrap_founder_from_env() -> None:
    """Create or update a founder account when env vars are provided."""

    email = _get_env("BOOTSTRAP_FOUNDER_EMAIL", "BOOTSTRAP_EMAIL")
    password = _get_env("BOOTSTRAP_FOUNDER_PASSWORD", "BOOTSTRAP_PASSWORD")
    company_name = _get_env("BOOTSTRAP_FOUNDER_COMPANY", "BOOTSTRAP_COMPANY")
    company_domain = _get_env("BOOTSTRAP_FOUNDER_DOMAIN", "BOOTSTRAP_DOMAIN")

    if not all([email, password, company_name, company_domain]):
        return

    display_name = _get_env("BOOTSTRAP_FOUNDER_NAME", "BOOTSTRAP_NAME") or email
    username = _get_env("BOOTSTRAP_FOUNDER_USERNAME", "BOOTSTRAP_USERNAME") or email
    allow_updates = _env_flag("BOOTSTRAP_FOUNDER_UPDATE", "true")

    with Session(engine) as session:
        company = session.exec(select(Company).where(Company.domain == company_domain)).first()
        if not company:
            company = Company(id=str(uuid4()), name=company_name, domain=company_domain)
            session.add(company)
            logger.info("Created company %s for founder bootstrap", company.name)

        user = session.exec(select(User).where(User.email == email)).first()
        if user:
            changed = False
            if user.company_id != company.id:
                user.company_id = company.id
                changed = True
            if user.role != ROLE_FOUNDER:
                user.role = ROLE_FOUNDER
                changed = True
            if allow_updates:
                user.password_hash = hash_password(password)
                user.username = username or user.username or email
                user.name = display_name or user.name or username or email
                changed = True

            if changed:
                session.add(user)
                session.commit()
                logger.info("Founder account updated for %s", email)
            else:
                logger.info("Founder account already present for %s", email)
            return

        founder = User(
            id=str(uuid4()),
            company_id=company.id,
            email=email,
            username=username,
            name=display_name,
            role=ROLE_FOUNDER,
            password_hash=hash_password(password),
        )
        session.add(founder)
        session.commit()
        logger.info("Founder account created for %s", email)
