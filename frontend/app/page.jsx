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
    <section className="grid" style={{ gap: "1.5rem" }}>
      <div className="grid" style={{ gap: "0.5rem" }}>
        <div className="badge-list">
          <span className="pill">Preview UI</span>
          <span className="muted tiny">Next.js 15 · React 19 RC</span>
        </div>
        <h1 style={{ margin: 0 }}>Welcome to Phill</h1>
        <p className="muted" style={{ margin: 0 }}>
          Use this scaffold to verify connectivity and navigate the core areas while APIs and styling
          are finalized.
        </p>
      </div>

      <div className="card grid" style={{ gap: "0.75rem" }}>
        <div className="status-row">
          <strong>API health:</strong>
          {status.state === "idle" && <span className="muted">Checking…</span>}
          {status.state === "ok" && <span className="status-ok">Reachable</span>}
          {status.state === "error" && (
            <span className="status-error">
              Unreachable {status.detail ? `(${status.detail})` : ""}
            </span>
          )}
        </div>
        <div className="tiny">
          <div>
            <strong>API base</strong>: {apiBase}
          </div>
          <div>
            <strong>Health URL</strong>: {healthUrl}
          </div>
          <p className="muted" style={{ marginBottom: 0 }}>
            If health shows unreachable, confirm `.env` sets `NEXT_PUBLIC_API_URL` and `NEXT_BACKEND_URL`,
            then rebuild the frontend image or restart `npm run dev`.
          </p>
        </div>
      </div>

      <div className="card grid" style={{ gap: "0.75rem" }}>
        <div className="grid" style={{ gap: "0.25rem" }}>
          <strong>Explore the scaffold</strong>
          <span className="muted tiny">
            Links open the current placeholder pages so you can confirm routing works end-to-end.
          </span>
        </div>
        <div className="cta-links">
          {links.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
