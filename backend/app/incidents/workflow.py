def escalate_status(current: str) -> str:
    order = ["open", "triage", "review", "closed"]
    try:
        idx = order.index(current)
    except ValueError:
        return "open"
    return order[min(idx + 1, len(order) - 1)]
