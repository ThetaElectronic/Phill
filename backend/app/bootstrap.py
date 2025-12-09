"""Startup helpers for seeding core access."""

from __future__ import annotations

import logging
import os
from typing import Literal
from uuid import uuid4

from sqlalchemy import func
from sqlmodel import Session, select

from app.companies.models import Company
from app.db import engine
from app.security.password import hash_password
from app.users.models import User
from app.users.permissions import ROLE_FOUNDER
from app.utils.email import normalize_email

logger = logging.getLogger(__name__)


def _env_flag(name: str, default: str = "true") -> bool:
    return os.getenv(name, default).lower() not in {"0", "false", "no"}


def _get_env(*keys: str) -> str | None:
    for key in keys:
        value = os.getenv(key)
        if value is None:
            continue

        stripped = value.strip()
        if stripped:
            return stripped
    return None


def bootstrap_founder(
    *,
    company_name: str,
    company_domain: str,
    email: str,
    username: str | None,
    password: str,
    display_name: str | None = None,
    update_if_exists: bool = False,
) -> tuple[str, Literal["created", "updated", "exists"]]:
    """Create or update a founder account and ensure the company exists."""

    normalized_email = normalize_email(email)

    with Session(engine) as session:
        company = session.exec(select(Company).where(Company.domain == company_domain)).first()
        if not company:
            company = Company(id=str(uuid4()), name=company_name, domain=company_domain)
            session.add(company)
            logger.info("Created company %s for founder bootstrap", company.name)

        user = session.exec(select(User).where(func.lower(User.email) == normalized_email)).first()
        if user:
            changed = False
            if user.email != normalized_email:
                user.email = normalized_email
                changed = True
            if user.company_id != company.id:
                user.company_id = company.id
                changed = True
            if user.role != ROLE_FOUNDER:
                user.role = ROLE_FOUNDER
                changed = True
            if update_if_exists:
                user.password_hash = hash_password(password)
                user.username = username or user.username or normalized_email
                user.name = display_name or user.name or username or normalized_email
                changed = True

            if changed:
                session.add(user)
                session.commit()
                logger.info("Founder account updated for %s", normalized_email)
                return user.email, "updated"

            logger.info("Founder account already present for %s", normalized_email)
            return user.email, "exists"

        founder = User(
            id=str(uuid4()),
            company_id=company.id,
            email=normalized_email,
            username=username or normalized_email,
            name=display_name or username or normalized_email,
            role=ROLE_FOUNDER,
            password_hash=hash_password(password),
        )
        session.add(founder)
        session.commit()
        logger.info("Founder account created for %s", normalized_email)
        return founder.email, "created"


def bootstrap_founder_from_env() -> None:
    """Create or update a founder account when env vars are provided."""

    email = _get_env("BOOTSTRAP_FOUNDER_EMAIL", "BOOTSTRAP_EMAIL")
    password = _get_env("BOOTSTRAP_FOUNDER_PASSWORD", "BOOTSTRAP_PASSWORD")
    company_name = _get_env("BOOTSTRAP_FOUNDER_COMPANY", "BOOTSTRAP_COMPANY")
    company_domain = _get_env("BOOTSTRAP_FOUNDER_DOMAIN", "BOOTSTRAP_DOMAIN")

    required = {
        "BOOTSTRAP_FOUNDER_EMAIL/BOOTSTRAP_EMAIL": email,
        "BOOTSTRAP_FOUNDER_PASSWORD/BOOTSTRAP_PASSWORD": password,
        "BOOTSTRAP_FOUNDER_COMPANY/BOOTSTRAP_COMPANY": company_name,
        "BOOTSTRAP_FOUNDER_DOMAIN/BOOTSTRAP_DOMAIN": company_domain,
    }
    missing = [name for name, value in required.items() if not value]
    if missing:
        logger.info(
            "Skipping founder bootstrap; missing env vars: %s", ", ".join(missing)
        )
        return

    normalized_email = normalize_email(email)
    display_name = _get_env("BOOTSTRAP_FOUNDER_NAME", "BOOTSTRAP_NAME") or normalized_email
    username = _get_env("BOOTSTRAP_FOUNDER_USERNAME", "BOOTSTRAP_USERNAME") or normalized_email
    allow_updates = _env_flag("BOOTSTRAP_FOUNDER_UPDATE", "true")

    email, action = bootstrap_founder(
        company_name=company_name,
        company_domain=company_domain,
        email=normalized_email,
        username=username,
        password=password,
        display_name=display_name,
        update_if_exists=allow_updates,
    )
    logger.info("Founder bootstrap %s for %s", action, email)
