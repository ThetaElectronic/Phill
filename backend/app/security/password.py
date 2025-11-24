from argon2 import PasswordHasher

from app.config import get_settings

_settings = get_settings()
_hasher = PasswordHasher()


def hash_password(password: str) -> str:
    salted = f"{password}{_settings.password_pepper}"
    return _hasher.hash(salted)


def verify_password(password: str, hashed: str) -> bool:
    salted = f"{password}{_settings.password_pepper}"
    try:
        return _hasher.verify(hashed, salted)
    except Exception:
        return False
