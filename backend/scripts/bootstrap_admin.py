from __future__ import annotations

import argparse
from uuid import uuid4

from sqlmodel import Session, select

from app.companies.models import Company
from app.db import engine
from app.security.password import hash_password
from app.users.models import User
from app.users.permissions import ROLE_ADMIN


def bootstrap_admin(
    *,
    company_name: str,
    company_domain: str,
    email: str,
    username: str | None,
    password: str,
    display_name: str | None = None,
) -> str:
    """Create an admin account if it does not exist and ensure the company is present.

    Returns the created or existing admin email for logging.
    """

    with Session(engine) as session:
        company = session.exec(select(Company).where(Company.domain == company_domain)).first()
        if not company:
            company = Company(id=str(uuid4()), name=company_name, domain=company_domain)
            session.add(company)

        user = session.exec(select(User).where(User.email == email)).first()
        if user:
            return user.email

        admin = User(
            id=str(uuid4()),
            company_id=company.id,
            email=email,
            username=username or email,
            name=display_name or username or email,
            role=ROLE_ADMIN,
            password_hash=hash_password(password),
        )
        session.add(admin)
        session.commit()
        return admin.email


def main() -> None:
    parser = argparse.ArgumentParser(description="Bootstrap an admin account.")
    parser.add_argument("--company", required=True, help="Company name")
    parser.add_argument("--domain", required=True, help="Company domain")
    parser.add_argument("--email", required=True, help="Admin email")
    parser.add_argument("--username", help="Admin username (defaults to the email)")
    parser.add_argument("--password", required=True, help="Admin password")
    parser.add_argument("--name", help="Display name (defaults to username)")

    args = parser.parse_args()

    email = bootstrap_admin(
        company_name=args.company,
        company_domain=args.domain,
        email=args.email,
        username=args.username,
        password=args.password,
        display_name=args.name,
    )
    print(f"Admin ready: {email}")


if __name__ == "__main__":
    main()
