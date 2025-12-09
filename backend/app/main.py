from fastapi import FastAPI

from app.ai.router import router as ai_router
from app.db import create_db_and_tables
from app.security.auth import router as auth_router
from app.users.routes import router as users_router
from app.companies.routes import router as companies_router
from app.incidents.routes import router as incidents_router
from app.documents.routes import router as documents_router
from app.tickets.routes import router as tickets_router
from app.admin.routes import router as admin_router
from app.bootstrap import bootstrap_founder_from_env
from app.middleware.logging import install_logging_middleware
from app.middleware.rate_limit import install_rate_limit_middleware
from app.middleware.tenant import install_tenant_middleware
from app.middleware.security import install_security_headers
from app.utils.response import add_exception_handlers


app = FastAPI(title="Phill API", version="0.1.0")


@app.on_event("startup")
def on_startup() -> None:
    create_db_and_tables()
    bootstrap_founder_from_env()

# Install middleware stack
install_logging_middleware(app)
install_rate_limit_middleware(app)
install_tenant_middleware(app)
install_security_headers(app)
add_exception_handlers(app)

# Routers
app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(users_router, prefix="/api/users", tags=["users"])
app.include_router(companies_router, prefix="/api/companies", tags=["companies"])
app.include_router(incidents_router, prefix="/api/incidents", tags=["incidents"])
app.include_router(documents_router, prefix="/api/documents", tags=["documents"])
app.include_router(tickets_router, prefix="/api/tickets", tags=["tickets"])
app.include_router(ai_router, prefix="/api/ai", tags=["ai"])
app.include_router(admin_router, prefix="/api/admin", tags=["admin"])


@app.get("/health", tags=["health"])
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/health", tags=["health"])
def api_health_check() -> dict[str, str]:
    """Health endpoint that aligns with the `/api` proxy path."""
    return {"status": "ok"}
