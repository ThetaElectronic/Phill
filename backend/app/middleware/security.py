from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings


def install_security_headers(app: FastAPI) -> None:
    settings = get_settings()
    csp_policy = settings.csp_directives or " ".join(
        [
            "default-src 'self'",
            "frame-ancestors 'none'",
            "object-src 'none'",
            "base-uri 'none'",
            "img-src 'self' data:",
            f"connect-src 'self' {settings.frontend_url}",
            "script-src 'self'",
            "style-src 'self' 'unsafe-inline'",
        ]
    )

    @app.middleware("http")
    async def add_security_headers(request, call_next):  # type: ignore[override]
        response = await call_next(request)
        response.headers.setdefault("Content-Security-Policy", csp_policy)
        response.headers.setdefault("Referrer-Policy", "no-referrer")
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
        return response

    origins = settings.cors_origins or [settings.frontend_url]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
