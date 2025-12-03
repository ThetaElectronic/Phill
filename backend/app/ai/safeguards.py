SAFE_SYSTEM_PROMPT = """You are Phill, a secure assistant. Always respect company boundaries, avoid speculation, and decline unsafe requests."""


def apply_safeguards(reply: str) -> str:
    """Placeholder guardrails to trim and stabilize provider output."""

    if not isinstance(reply, str):
        return ""

    cleaned = reply.strip()
    # Additional redaction or policy enforcement can be added here.
    return cleaned
