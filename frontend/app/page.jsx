"use client";

import { useEffect, useMemo, useState } from "react";

import { apiUrl, getApiBase } from "../lib/api";

const links = [
  { href: "/login", label: "Login" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/incidents/create", label: "Report incident" },
  { href: "/documents", label: "Documents" },
  { href: "/ai", label: "Phill AI" },
  { href: "/admin/system", label: "Admin system" },
];

export default function HomePage() {
  const apiBase = getApiBase();
  const healthUrl = useMemo(() => apiUrl("/health"), []);

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
      <div className="hero">
        <div className="grid" style={{ gap: "0.6rem" }}>
          <div className="chip-row">
            <span className="pill pill-outline" style={{ color: "#e0f2fe", borderColor: "#bfdbfe" }}>
              Live preview
            </span>
            <span className="muted tiny" style={{ color: "#e0f2fe" }}>
              Next.js 15 · React 19 RC · FastAPI backend
            </span>
          </div>
          <h1>Welcome to Phill</h1>
          <p>
            Verify routing, API reachability, and tenant isolation from one screen. Use the quick links to
            jump into auth, incidents, documents, or AI chat.
          </p>
          <div className="cta-links">
            {links.map((link) => (
              <a key={link.href} href={link.href} className="pill-outline" style={{ color: "#0f172a" }}>
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="muted tiny">API base</div>
          <strong>{apiBase}</strong>
          <div className="tiny muted">Rebuild the frontend if you change this value.</div>
        </div>
        <div className="stat-card">
          <div className="muted tiny">Health URL</div>
          <strong>{healthUrl}</strong>
          <div className="status-row">
            <span className="muted tiny">Status:</span>
            {status.state === "idle" && <span className="muted">Checking…</span>}
            {status.state === "ok" && <span className="status-ok">Reachable</span>}
            {status.state === "error" && (
              <span className="status-error">Unreachable {status.detail ? `(${status.detail})` : ""}</span>
            )}
          </div>
        </div>
        <div className="stat-card">
          <div className="muted tiny">Next steps</div>
          <div className="grid" style={{ gap: "0.2rem" }}>
            <span className="tiny">1) Ensure tokens are saved after login</span>
            <span className="tiny">2) Post an incident to confirm tenant scoping</span>
            <span className="tiny">3) Upload a document and refresh the list</span>
          </div>
        </div>
      </div>
    </section>
  );
}
