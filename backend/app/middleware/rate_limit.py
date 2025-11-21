from collections import defaultdict
from time import monotonic

from fastapi import FastAPI, Request, Response, status

WINDOW = 60
LIMIT = 100


class MemoryRateLimiter:
    def __init__(self) -> None:
        self.requests: dict[str, list[float]] = defaultdict(list)

    def allow(self, key: str) -> bool:
        now = monotonic()
        window_start = now - WINDOW
        bucket = self.requests[key]
        self.requests[key] = [ts for ts in bucket if ts >= window_start]
        if len(self.requests[key]) >= LIMIT:
            return False
        self.requests[key].append(now)
        return True


limiter = MemoryRateLimiter()


def install_rate_limit_middleware(app: FastAPI) -> None:
    @app.middleware("http")
    async def rate_limit(request: Request, call_next):  # type: ignore[override]
        client_ip = request.client.host if request.client else "anonymous"
        if not limiter.allow(client_ip):
            return Response(status_code=status.HTTP_429_TOO_MANY_REQUESTS)
        return await call_next(request)
