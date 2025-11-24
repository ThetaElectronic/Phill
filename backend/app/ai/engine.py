from typing import Any

import openai

from app.config import get_settings

_settings = get_settings()
client = openai.OpenAI(api_key=_settings.openai_api_key)


def run_completion(prompt: str, system: str | None = None) -> dict[str, Any]:
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})
    response = client.chat.completions.create(model="gpt-5.1", messages=messages, max_tokens=256)
    return response.model_dump()
