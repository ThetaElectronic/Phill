from datetime import datetime


def audit_entry(action: str, actor_id: str, incident_id: str) -> dict:
    return {"action": action, "actor": actor_id, "incident": incident_id, "timestamp": datetime.utcnow().isoformat()}
