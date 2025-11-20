from fastapi import APIRouter

from app.admin.system_checks import system_status

router = APIRouter()


@router.get("/status")
def get_status() -> dict[str, str]:
    return system_status()
