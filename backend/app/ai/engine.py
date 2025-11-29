from typing import Any

from openai import APIConnectionError, APIStatusError, OpenAI, OpenAIError, RateLimitError

from app.config import get_settings

_settings = get_settings()
_client = OpenAI(api_key=_settings.openai_api_key)


def run_completion(prompt: str, system: str | None = None) -> dict[str, Any]:
    if not _settings.openai_api_key:
        raise RuntimeError("OpenAI API key is not configured")

    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    try:
        response = _client.chat.completions.create(
            model=_settings.ai_model,
            messages=messages,
            max_tokens=256,
        )
    except (APIConnectionError, APIStatusError, RateLimitError, OpenAIError) as exc:  # pragma: no cover - network dependent
        raise RuntimeError(str(exc)) from exc

    return response.model_dump()
