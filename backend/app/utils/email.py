"""Email utilities."""


def normalize_email(value: str) -> str:
    """Trim and lowercase an email address for consistent storage and lookups."""

    return value.strip().lower()

