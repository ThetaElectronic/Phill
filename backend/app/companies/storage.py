from pathlib import Path


def company_storage_root(base_dir: Path, company_id: str) -> Path:
    return base_dir / company_id
