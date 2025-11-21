"use client";

import { useEffect, useMemo, useState } from "react";

const links = [
  { href: "/login", label: "Login" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/incidents/create", label: "Report incident" },
  { href: "/documents", label: "Documents" },
  { href: "/ai", label: "Phill AI" },
  { href: "/admin/system", label: "Admin system" },
];

export default function HomePage() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "/api";
  const healthUrl = useMemo(() => {
    if (apiBase.endsWith("/")) return `${apiBase}health`;
    return `${apiBase}/health`;
  }, [apiBase]);

  const [status, setStatus] = useState({ state: "idle" });

  useEffect(() => {
    let cancelled = false;
    async function checkHealth() {
      try {
        const res = await fetch(healthUrl, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        if (cancelled) return;
        setStatus({ state: "ok" });
      } catch (error) {
        if (cancelled) return;
        const detail = error instanceof Error ? error.message : "unknown error";
        setStatus({ state: "error", detail });
      }
    }

    checkHealth();
    return () => {
      cancelled = true;
    };
  }, [healthUrl]);

  return (
    <section style={{ display: "grid", gap: "1rem" }}>
      <div style={{ display: "grid", gap: "0.5rem" }}>
        <h1>Phill platform scaffold</h1>
        <p>
          The frontend is wired to Next.js 15 with React 19 release candidates. Use the links below
          to navigate to the placeholder pages while API wiring and styling are completed.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gap: "0.5rem",
          padding: "1rem",
          border: "1px solid #ddd",
          borderRadius: "0.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <strong>API health:</strong>
          {status.state === "idle" && <span>Checking…</span>}
          {status.state === "ok" && <span style={{ color: "green" }}>Reachable</span>}
          {status.state === "error" && (
            <span style={{ color: "crimson" }}>
              Unreachable {status.detail ? `(${status.detail})` : ""}
            </span>
          )}
        </div>
        <div style={{ fontSize: "0.9rem" }}>
          <div>
            <strong>API base</strong>: {apiBase}
          </div>
          <div>
            <strong>Health URL</strong>: {healthUrl}
          </div>
          <p style={{ margin: 0 }}>
            If health shows unreachable, verify your `.env` has `NEXT_PUBLIC_API_URL` and
            `NEXT_BACKEND_URL` set correctly, then rebuild the frontend image or restart `npm run dev`.
          </p>
        </div>
      </div>

      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        {links.map((link) => (
          <a key={link.href} href={link.href}>
            {link.label}
          </a>
        ))}
      </div>
    </section>
  );
}
