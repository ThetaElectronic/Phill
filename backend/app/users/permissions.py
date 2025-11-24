ROLE_USER = "user"
ROLE_SUPERVISOR = "supervisor"
ROLE_MANAGER = "manager"
ROLE_ADMIN = "admin"
ROLE_FOUNDER = "founder"

ROLE_HIERARCHY = [ROLE_USER, ROLE_SUPERVISOR, ROLE_MANAGER, ROLE_ADMIN, ROLE_FOUNDER]


def has_role(role: str, required: str) -> bool:
    try:
        return ROLE_HIERARCHY.index(role) >= ROLE_HIERARCHY.index(required)
    except ValueError:
        return False
