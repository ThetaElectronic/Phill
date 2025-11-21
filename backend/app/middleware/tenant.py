from fastapi import FastAPI, Request

COMPANY_HEADER = "X-Company-ID"


def install_tenant_middleware(app: FastAPI) -> None:
    @app.middleware("http")
    async def add_tenant_context(request: Request, call_next):  # type: ignore[override]
        request.state.company_id = request.headers.get(COMPANY_HEADER)
        return await call_next(request)
