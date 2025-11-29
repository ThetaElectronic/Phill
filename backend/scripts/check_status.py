#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import ssl
import sys
import urllib.error
import urllib.request
from typing import Iterable


DEFAULT_BASE = "http://localhost:8001"
DEFAULT_ENDPOINTS: tuple[str, ...] = ("/health", "/api/health")


def fetch(url: str, *, insecure: bool = False, timeout: float = 5.0) -> tuple[int, str]:
    context = ssl._create_unverified_context() if insecure else None
    req = urllib.request.Request(url, headers={"User-Agent": "phill-health-check/1"})
    try:
        with urllib.request.urlopen(  # type: ignore[no-untyped-call]
            req, timeout=timeout, context=context
        ) as resp:
            body = resp.read().decode("utf-8")
            return resp.status, body
    except urllib.error.HTTPError as exc:  # type: ignore[attr-defined]
        return exc.code, exc.read().decode("utf-8", errors="replace")
    except urllib.error.URLError as exc:  # type: ignore[attr-defined]
        return 0, str(exc)


def check_endpoints(
    base_url: str,
    endpoints: Iterable[str],
    *,
    insecure: bool,
    timeout: float,
) -> int:
    failures = 0
    for path in endpoints:
        url = f"{base_url.rstrip('/')}{path}"
        status, body = fetch(url, insecure=insecure, timeout=timeout)
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
    parser.add_argument(
        "--include-healthz",
        action="store_true",
        help="Also probe /healthz (useful when checking Nginx/proxy)",
    )
    parser.add_argument(
        "--insecure",
        action="store_true",
        help="Skip TLS verification (useful with self-signed certs)",
    )
    parser.add_argument(
        "--timeout",
        type=float,
        default=5.0,
        help="Request timeout in seconds (default 5.0)",
    )
    args = parser.parse_args()

    endpoints: tuple[str, ...] = DEFAULT_ENDPOINTS
    if args.include_healthz:
        endpoints = (*DEFAULT_ENDPOINTS, "/healthz")

    failures = check_endpoints(
        args.base_url, endpoints, insecure=args.insecure, timeout=args.timeout
    )
    if failures:
        sys.exit(1)


if __name__ == "__main__":
    main()
