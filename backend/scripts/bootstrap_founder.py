from __future__ import annotations

import argparse

from app.bootstrap import bootstrap_founder


def main() -> None:
    parser = argparse.ArgumentParser(description="Bootstrap a founder account.")
    parser.add_argument("--company", required=True, help="Company name")
    parser.add_argument("--domain", required=True, help="Company domain")
    parser.add_argument("--email", required=True, help="Founder email")
    parser.add_argument("--username", help="Founder username (defaults to the email)")
    parser.add_argument("--password", required=True, help="Founder password")
    parser.add_argument("--name", help="Display name (defaults to username)")
    parser.add_argument(
        "--update",
        action="store_true",
        help="Update the password/name if the founder already exists",
    )

    args = parser.parse_args()

    email, action = bootstrap_founder(
        company_name=args.company,
        company_domain=args.domain,
        email=args.email,
        username=args.username,
        password=args.password,
        display_name=args.name,
        update_if_exists=args.update,
    )
    verb = "updated" if action == "updated" else "ready"
    print(f"Founder {verb}: {email}")


if __name__ == "__main__":
    main()
