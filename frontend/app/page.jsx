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
    <section className="grid" style={{ gap: "1.6rem", position: "relative" }}>
      <div className="hero mosaic" style={{ position: "relative", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle at 15% 20%, rgba(255,255,255,0.12) 0, transparent 32%), radial-gradient(circle at 85% 12%, rgba(255,255,255,0.14) 0, transparent 34%)",
            pointerEvents: "none",
          }}
          aria-hidden
        />
        <div className="hero-left">
          <div className="chip-row">
            <span className="pill pill-outline soft">Live preview</span>
            <span className="pill-ghost">Dockerized · Nginx</span>
            <span className="muted tiny" style={{ color: "#dbeafe" }}>
              Next.js 15 · React 19 RC · FastAPI backend
            </span>
          </div>
          <h1 className="headline">Welcome to Phill</h1>
          <p className="lede">
            Validate the full stack in one place. Hit auth, incidents, documents, and AI with your tenant scope
            and see responses live.
          </p>
          <div className="floating-badges">
            {links.map((link) => (
              <a key={link.href} href={link.href} className="pill-outline solid">
                {link.label}
              </a>
            ))}
          </div>
          <div className="sparkle">
            <dot />
            <span className="tiny">app.jarvis-fuel.com · CORS/CSP hardened · JWT + refresh</span>
          </div>
          <div className="highlight-ribbon">
            <span>Quick path</span>
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

      <div className="hero-bento">
        <div className="bento-card">
          <h3 style={{ marginBottom: "0.35rem" }}>Deployment snapshot</h3>
          <div className="stack" style={{ gap: "0.35rem" }}>
            <div className="stat-row" style={{ alignItems: "center" }}>
              <span className="pill small">API base</span>
              <span className="tiny" style={{ wordBreak: "break-all" }}>{apiBase}</span>
            </div>
            <div className="stat-row" style={{ alignItems: "center" }}>
              <span className="pill small">Health</span>
              <span className={statusChip}>
                {status.state === "idle" && "Checking…"}
                {status.state === "ok" && "Reachable"}
                {status.state === "error" && "Unreachable"}
              </span>
            </div>
            <div className="stat-bar">
              <span style={{ width: status.state === "ok" ? "100%" : status.state === "error" ? "15%" : "40%" }} />
            </div>
            <div className="tiny muted accent-rail">
              Rebuild the frontend image if you change <code>NEXT_PUBLIC_API_URL</code> so baked assets point at the
              right backend.
            </div>
          </div>
        </div>
        <div className="bento-card">
          <h3 style={{ marginBottom: "0.35rem" }}>Auth + roles</h3>
          <div className="stack" style={{ gap: "0.3rem" }}>
            <div className="badge-list">
              <span className="pill">JWT</span>
              <span className="pill pill-outline">Refresh tokens</span>
              <span className="pill pill-success">RBAC</span>
            </div>
            <div className="timeline">
              <div className="timeline-item">
                <strong>Sign in</strong>
                <div className="tiny muted">Use /login to fetch tokens from the live API.</div>
              </div>
              <div className="timeline-item">
                <strong>Scope</strong>
                <div className="tiny muted">Company + role gates protect incidents, documents, and tickets.</div>
              </div>
              <div className="timeline-item">
                <strong>Rotate</strong>
                <div className="tiny muted">Refresh endpoint is wired; revoke/rotate via the backend.</div>
              </div>
            </div>
          </div>
        </div>
        <div className="bento-card">
          <h3 style={{ marginBottom: "0.35rem" }}>AI + docs</h3>
          <div className="stack" style={{ gap: "0.45rem" }}>
            <div className="stat-row" style={{ alignItems: "center" }}>
              <span className="pill small">AI</span>
              <span className="tiny muted">GPT-5.1 with optional company memory</span>
            </div>
            <div className="stat-row" style={{ alignItems: "center" }}>
              <span className="pill small">Docs</span>
              <span className="tiny muted">Upload + list scoped to your company</span>
            </div>
            <div className="divider" />
            <div className="tiny muted">Try the AI page, toggle memory, and upload a file to see the list refresh live.</div>
            <div className="floating-badges">
              <span className="pill">/ai</span>
              <span className="pill">/documents</span>
              <span className="pill">/incidents</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
