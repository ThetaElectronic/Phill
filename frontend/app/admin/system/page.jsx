"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import AdminWall from "../../../components/AdminWall";
import { fetchWithAuth } from "../../../lib/api";
import { formatDateTime, formatRelative, formatTime, safeDate } from "../../../lib/dates";

function StatusPill({ ok, label }) {
  const className = ok ? "pill pill-success" : "pill pill-outline";
  return <span className={className}>{label}</span>;
}

function StatusCard({ title, description, status }) {
  const ok = status?.ok;
  const detail = status?.detail;

  return (
    <section className="card surface stack" style={{ gap: "0.55rem" }}>
      <div className="stack" style={{ gap: "0.1rem" }}>
        <div className="badge-list">
          <span className="pill">Admin</span>
          <span className="pill pill-outline">{title}</span>
        </div>
        <h2 style={{ margin: 0 }}>{title}</h2>
        <p className="muted" style={{ margin: 0 }}>
          {description}
        </p>
      </div>
      <div className="chip-row" style={{ gap: "0.35rem", alignItems: "center", flexWrap: "wrap" }}>
        <StatusPill ok={ok} label={ok ? "Healthy" : "Needs attention"} />
        {detail && <span className="tiny muted">{detail}</span>}
        {!detail && !ok && <span className="tiny muted">Waiting for configuration.</span>}
      </div>
    </section>
  );
}

export default function AdminSystemPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = useCallback(async (allowUpdate = true) => {
    if (allowUpdate) {
      setLoading(true);
      setError("");
    }
    try {
      const res = await fetchWithAuth("/api/admin/status");
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const payload = await res.json();
      if (allowUpdate) {
        setData(payload);
        const checked = safeDate(payload.checked_at) || new Date();
        setLastUpdated(checked);
      }
    } catch (err) {
      if (allowUpdate) setError(err.message || "Unable to load status");
    } finally {
      if (allowUpdate) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const hydrate = async () => {
      await load(active);
    };

    hydrate();
    const interval = setInterval(hydrate, 30000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [load]);

  const cards = useMemo(() => {
    if (!data) return [];
    return [
      {
        key: "database",
        title: "Database",
        description: "Connectivity to the SQL database backing user and tenant data.",
        status: data.database,
      },
      {
        key: "email",
        title: "Email",
        description: "SMTP configuration required for resets, access requests, and admin tests.",
        status: data.email,
      },
      {
        key: "ai",
        title: "AI",
        description: "OpenAI key/model configuration for chat completions.",
        status: data.ai,
      },
    ];
  }, [data]);

  const overallHealthy = data?.status === "ok";
  const environment = data?.environment || "unknown";
  const version = data?.version || "dev";

  return (
    <AdminWall
      title="Admin system panel is protected"
      description="Login with admin permissions to view system checks and metrics."
    >
      <section className="stack" style={{ gap: "1rem" }}>
        <div className="stack" style={{ gap: "0.35rem" }}>
          <div className="badge-list">
            <span className="pill">Admin</span>
            <span className="pill pill-outline">System</span>
          </div>
          <h1 style={{ margin: 0 }}>System checks</h1>
          <p className="muted" style={{ margin: 0 }}>
            Simple health view for admins. Deep details live in diagnostics.
          </p>
          <a className="chip secondary" href="/admin/diagnostics">
            Diagnostics
          </a>
        </div>

        <div className="chip-row" style={{ alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <button type="button" className="secondary" onClick={load} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh now"}
          </button>
          <span className="tiny muted">
            Updated {formatRelative(lastUpdated, "Not yet checked")}
          </span>
        </div>

        {loading && <div className="status-info">Loading live status…</div>}
        {error && <div className="status-error">{error}</div>}

        {!loading && !error && data && (
          <section className="card glass chip-row" style={{ gap: "0.35rem", alignItems: "center", flexWrap: "wrap" }}>
            <StatusPill ok={overallHealthy} label={overallHealthy ? "All systems healthy" : "Needs attention"} />
            <span className="pill pill-outline">Env: {environment}</span>
            <span className="pill pill-outline">Version: {version}</span>
            <span className="tiny muted">
              <span title={formatDateTime(lastUpdated, "Not yet checked")}>Checked {formatRelative(lastUpdated, "Not yet checked")}</span>
            </span>
          </section>
        )}

        {!loading && !error && data && (
          <div className="grid three" style={{ gap: "1rem" }}>
            {cards.map((card) => (
              <StatusCard key={card.key} title={card.title} description={card.description} status={card.status} />
            ))}
          </div>
        )}

        {/* Detailed metrics live in diagnostics now to reduce clutter */}
      </section>
    </AdminWall>
  );
}
