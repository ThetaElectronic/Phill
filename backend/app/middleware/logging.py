import logging
from time import monotonic

from fastapi import FastAPI, Request

logger = logging.getLogger("phill.api")
logging.basicConfig(level=logging.INFO)


def install_logging_middleware(app: FastAPI) -> None:
    @app.middleware("http")
    async def log_requests(request: Request, call_next):  # type: ignore[override]
        start = monotonic()
        response = await call_next(request)
        duration = monotonic() - start
        logger.info("%s %s completed in %.3fs", request.method, request.url.path, duration)
        return response
