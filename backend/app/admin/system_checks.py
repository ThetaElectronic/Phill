from datetime import datetime, timezone

from app.admin.metrics import api_latency_bucket
from app.ai.engine import ai_configuration
from app.communication.email import smtp_configured
from app.db import ping_database


def system_status() -> dict[str, object]:
    db_ok, db_detail = ping_database()
    ai_status = ai_configuration()

    email_ok = smtp_configured()
    email_detail = None if email_ok else "SMTP settings are not configured"

    overall_ok = db_ok and ai_status["ok"]

    return {
        "status": "ok" if overall_ok else "degraded",
        "database": {"ok": db_ok, "detail": db_detail},
        "email": {"ok": email_ok, "detail": email_detail},
        "ai": ai_status,
        "metrics": api_latency_bucket(),
        "checked_at": datetime.now(timezone.utc).isoformat(),
    }
