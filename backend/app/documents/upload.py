from pathlib import Path


class LocalDocumentStore:
    def __init__(self, base_dir: Path):
        self.base_dir = base_dir
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def save(self, company_id: str, filename: str, content: bytes) -> str:
        target_dir = self.base_dir / company_id
        target_dir.mkdir(parents=True, exist_ok=True)
        path = target_dir / filename
        path.write_bytes(content)
        return str(path)
