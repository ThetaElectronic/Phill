from datetime import datetime, timedelta, timezone
from typing import Any

from jose import jwt

from app.config import get_settings

_settings = get_settings()


class TokenType:
    ACCESS = "access"
    REFRESH = "refresh"


def _create_token(
    subject: str, expires_delta: timedelta, token_type: str, extra: dict[str, Any] | None = None
) -> str:
    payload: dict[str, Any] = {
        "sub": subject,
        "type": token_type,
        "exp": datetime.now(timezone.utc) + expires_delta,
        "iat": datetime.now(timezone.utc),
    }
    if extra:
        payload.update({key: value for key, value in extra.items() if value is not None})
    return jwt.encode(payload, _settings.jwt_secret, algorithm="HS256")


def create_access_token(
    subject: str,
    *,
    role: str | None = None,
    company_id: str | None = None,
    email: str | None = None,
    name: str | None = None,
    username: str | None = None,
) -> str:
    extra = {"role": role, "company_id": company_id, "email": email, "name": name, "username": username}
    return _create_token(subject, timedelta(minutes=_settings.jwt_expire_minutes), TokenType.ACCESS, extra)


def create_refresh_token(subject: str) -> str:
    return _create_token(subject, timedelta(days=_settings.jwt_refresh_expire_days), TokenType.REFRESH)


def decode_token(token: str) -> dict[str, Any]:
    return jwt.decode(token, _settings.jwt_secret, algorithms=["HS256"])
