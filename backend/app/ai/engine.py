from typing import Any

from openai import APIConnectionError, APIStatusError, OpenAI, OpenAIError, RateLimitError

from app.config import get_settings


def ai_configuration() -> dict[str, Any]:
    settings = get_settings()
    configured = bool(settings.openai_api_key and settings.ai_model)
    detail = None
    if not settings.openai_api_key:
        detail = "OPENAI_API_KEY is not set"
    elif not settings.ai_model:
        detail = "AI_MODEL is not set"

    return {"ok": configured, "model": settings.ai_model, "detail": detail}


def run_completion(prompt: str, system: str | None = None) -> dict[str, Any]:
    settings = get_settings()
    if not settings.openai_api_key:
        raise RuntimeError("OpenAI API key is not configured")
    if not settings.ai_model:
        raise RuntimeError("AI model is not configured")

    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    try:
        client = OpenAI(api_key=settings.openai_api_key)
        response = client.chat.completions.create(
            model=settings.ai_model,
            messages=messages,
            max_tokens=256,
        )
    except (APIConnectionError, APIStatusError, RateLimitError, OpenAIError) as exc:  # pragma: no cover - network dependent
        raise RuntimeError(str(exc)) from exc

    return response.model_dump()
