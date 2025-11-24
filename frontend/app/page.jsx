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

  const statusChip =
    status.state === "ok"
      ? "status-chip ok"
      : status.state === "error"
        ? "status-chip error"
        : "status-chip idle";

  return (
    <section className="grid" style={{ gap: "1.6rem" }}>
      <div className="hero mosaic">
        <div className="hero-left">
          <div className="chip-row">
            <span className="pill pill-outline soft">Live preview</span>
            <span className="muted tiny" style={{ color: "#dbeafe" }}>
              Next.js 15 · React 19 RC · FastAPI backend
            </span>
          </div>
          <h1 className="headline">Welcome to Phill</h1>
          <p className="lede">
            Validate the stack in one place: confirm API reachability, log in to capture a token, create an
            incident, upload a document, and chat with Phill using your tenant scope.
          </p>
          <div className="cta-links">
            {links.map((link) => (
              <a key={link.href} href={link.href} className="pill-outline solid">
                {link.label}
              </a>
            ))}
          </div>
          <div className="muted tiny" style={{ color: "#e2e8f0" }}>
            Deployed at app.jarvis-fuel.com · CORS + CSP hardened · JWT + refresh support
          </div>
          <div className="highlight-ribbon">
            <span>Quick start</span>
            <span className="divider-dot" aria-hidden />
            <span>Login → Incident → Documents → AI</span>
            <span className="divider-dot" aria-hidden />
            <span>Tenant scoped</span>
          </div>
        </div>
        <div className="hero-right glass card">
          <div className="stack" style={{ gap: "0.35rem" }}>
            <div className="muted tiny">API overview</div>
            <div className="stat-row">
              <span className="pill small">Base</span>
              <span className="tiny" style={{ wordBreak: "break-all" }}>
                {apiBase}
              </span>
            </div>
            <div className="stat-row">
              <span className="pill small">Health</span>
              <a href={healthUrl} className="tiny" style={{ wordBreak: "break-all" }}>
                {healthUrl}
              </a>
            </div>
            <div className="stat-row" style={{ alignItems: "center" }}>
              <span className="pill small">Status</span>
              <span className={statusChip}>
                {status.state === "idle" && "Checking…"}
                {status.state === "ok" && "Reachable"}
                {status.state === "error" && `Unreachable ${status.detail ? `(${status.detail})` : ""}`}
              </span>
            </div>
            <div className="divider" />
            <div className="stack" style={{ gap: "0.25rem" }}>
              <div className="tiny muted">Quick validation steps</div>
              <span className="tiny">1) Login and save the token in local storage</span>
              <span className="tiny">2) Post an incident and confirm it shows in Review</span>
              <span className="tiny">3) Upload a document and refresh the list</span>
              <span className="tiny">4) Chat with Phill and toggle memory on/off</span>
            </div>
          </div>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card gradient-card">
          <div className="muted tiny">API base</div>
          <strong>{apiBase}</strong>
          <div className="tiny muted">Rebuild the frontend if you change this value.</div>
        </div>
        <div className="stat-card gradient-card">
          <div className="muted tiny">Health URL</div>
          <strong>{healthUrl}</strong>
          <div className="status-row">
            <span className="muted tiny">Status:</span>
            <span className={statusChip}>
              {status.state === "idle" && "Checking…"}
              {status.state === "ok" && "Reachable"}
              {status.state === "error" && `Unreachable ${status.detail ? `(${status.detail})` : ""}`}
            </span>
          </div>
        </div>
        <div className="stat-card gradient-card">
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
