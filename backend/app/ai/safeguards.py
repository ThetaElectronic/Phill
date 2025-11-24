from typing import Any

SAFE_SYSTEM_PROMPT = """You are Phill, a secure assistant. Always respect company boundaries, avoid speculation, and decline unsafe requests."""


def apply_safeguards(payload: dict[str, Any]) -> dict[str, Any]:
    # Placeholder for hallucination filtering and redaction.
    payload["guardrails"] = "applied"
    return payload
