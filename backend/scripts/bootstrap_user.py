from __future__ import annotations

import argparse
import os
from uuid import uuid4

from sqlmodel import Session, select

from app.companies.models import Company
from app.db import engine
from app.security.password import hash_password
from app.users.models import User
from app.users.permissions import ROLE_ADMIN, ROLE_HIERARCHY


def bootstrap_user(
    *,
    company_name: str,
    company_domain: str,
    email: str,
    password: str,
    role: str = ROLE_ADMIN,
    username: str | None = None,
    display_name: str | None = None,
) -> str:
    """Create a user with the given role if it does not exist."""

    normalized_role = role if role in ROLE_HIERARCHY else ROLE_ADMIN

    with Session(engine) as session:
        company = session.exec(select(Company).where(Company.domain == company_domain)).first()
        if not company:
            company = Company(id=str(uuid4()), name=company_name, domain=company_domain)
            session.add(company)

        user = session.exec(select(User).where(User.email == email)).first()
        if user:
            return user.email

        member = User(
            id=str(uuid4()),
            company_id=company.id,
            email=email,
            username=username or email,
            name=display_name or username or email,
            role=normalized_role,
            password_hash=hash_password(password),
        )
        session.add(member)
        session.commit()
        return member.email


def main() -> None:
    parser = argparse.ArgumentParser(description="Bootstrap a user account (default admin role).")
    parser.add_argument("--company", default=os.getenv("BOOTSTRAP_COMPANY"), help="Company name")
    parser.add_argument("--domain", default=os.getenv("BOOTSTRAP_DOMAIN"), help="Company domain")
    parser.add_argument("--email", default=os.getenv("BOOTSTRAP_EMAIL"), help="User email")
    parser.add_argument("--password", default=os.getenv("BOOTSTRAP_PASSWORD"), help="User password")
    parser.add_argument("--role", default=os.getenv("BOOTSTRAP_ROLE", ROLE_ADMIN), help="User role (default admin)")
    parser.add_argument("--username", default=os.getenv("BOOTSTRAP_USERNAME"), help="Username (defaults to email)")
    parser.add_argument("--name", default=os.getenv("BOOTSTRAP_NAME"), help="Display name (defaults to username/email)")

    args = parser.parse_args()

    required = {
        "--company": args.company,
        "--domain": args.domain,
        "--email": args.email,
        "--password": args.password,
    }
    missing = [flag for flag, value in required.items() if not value]
    if missing:
        parser.error(f"Missing required arguments: {' '.join(missing)}")

    email = bootstrap_user(
        company_name=args.company,
        company_domain=args.domain,
        email=args.email,
        password=args.password,
        role=args.role,
        username=args.username,
        display_name=args.name,
    )
    print(f"User ready: {email}")


if __name__ == "__main__":
    main()
