from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.request
from typing import Iterable


DEFAULT_BASE = "http://localhost:8001"
ENDPOINTS: tuple[str, ...] = ("/health", "/api/health")


def fetch(url: str) -> tuple[int, str]:
    req = urllib.request.Request(url, headers={"User-Agent": "phill-health-check/1"})
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:  # type: ignore[no-untyped-call]
            body = resp.read().decode("utf-8")
            return resp.status, body
    except urllib.error.HTTPError as exc:  # type: ignore[attr-defined]
        return exc.code, exc.read().decode("utf-8", errors="replace")
    except urllib.error.URLError as exc:  # type: ignore[attr-defined]
        return 0, str(exc)


def check_endpoints(base_url: str, endpoints: Iterable[str]) -> int:
    failures = 0
    for path in endpoints:
        url = f"{base_url.rstrip('/')}{path}"
        status, body = fetch(url)
        ok = status == 200
        summary = body
        try:
            parsed = json.loads(body)
            if isinstance(parsed, dict) and "status" in parsed:
                summary = json.dumps(parsed)
        except json.JSONDecodeError:
            summary = body.strip() or "<empty>"

        mark = "✓" if ok else "✕"
        print(f"{mark} {url} -> {status} {summary}")
        if not ok:
            failures += 1
    return failures


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Check backend health endpoints (plain and /api prefixed).",
    )
    parser.add_argument(
        "--base-url",
        default=DEFAULT_BASE,
        help="Base URL for the backend (default http://localhost:8001)",
    )
    args = parser.parse_args()

    failures = check_endpoints(args.base_url, ENDPOINTS)
    if failures:
        sys.exit(1)


if __name__ == "__main__":
    main()
