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
    update_if_exists: bool = False,
) -> tuple[str, str]:
    """Create or update an admin account and ensure the company is present.

    Returns (email, action) where action is "created", "updated", or "exists".
    """

    with Session(engine) as session:
        company = session.exec(select(Company).where(Company.domain == company_domain)).first()
        if not company:
            company = Company(id=str(uuid4()), name=company_name, domain=company_domain)
            session.add(company)

        user = session.exec(select(User).where(User.email == email)).first()
        if user:
            if update_if_exists:
                user.company_id = company.id
                user.username = username or user.username or email
                user.name = display_name or user.name or username or email
                user.role = ROLE_ADMIN
                user.password_hash = hash_password(password)
                session.add(user)
                session.commit()
                return user.email, "updated"

            return user.email, "exists"

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
        return admin.email, "created"


def main() -> None:
    parser = argparse.ArgumentParser(description="Bootstrap an admin account.")
    parser.add_argument("--company", required=True, help="Company name")
    parser.add_argument("--domain", required=True, help="Company domain")
    parser.add_argument("--email", required=True, help="Admin email")
    parser.add_argument("--username", help="Admin username (defaults to the email)")
    parser.add_argument("--password", required=True, help="Admin password")
    parser.add_argument("--name", help="Display name (defaults to username)")
    parser.add_argument(
        "--update",
        action="store_true",
        help="Update the password/name if the admin already exists",
    )

    args = parser.parse_args()

    email, action = bootstrap_admin(
        company_name=args.company,
        company_domain=args.domain,
        email=args.email,
        username=args.username,
        password=args.password,
        display_name=args.name,
        update_if_exists=args.update,
    )
    verb = "updated" if action == "updated" else "ready"
    print(f"Admin {verb}: {email}")


if __name__ == "__main__":
    main()
