from fastapi import APIRouter, Depends

from app.admin.system_checks import system_status
from app.security.dependencies import require_role
from app.users.permissions import ROLE_ADMIN

router = APIRouter()


@router.get("/status")
def get_status(current_user=Depends(require_role(ROLE_ADMIN))) -> dict[str, str]:
    return system_status()
