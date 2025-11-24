from app.admin.metrics import api_latency_bucket


def system_status() -> dict[str, object]:
    return {"status": "ok", "metrics": api_latency_bucket()}
