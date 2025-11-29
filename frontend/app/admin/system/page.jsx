"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import AuthWall from "../../../components/AuthWall";
import { fetchWithAuth } from "../../../lib/api";

function StatusPill({ ok, label }) {
  const className = ok ? "pill pill-soft" : "pill pill-outline";
  return <span className={className}>{label}</span>;
}

function StatusCard({ title, description, status }) {
  const ok = status?.ok;
  const detail = status?.detail;
  const meta = status?.model || status?.metrics;

  return (
    <section className="glass stack" style={{ gap: "0.6rem" }}>
      <div className="stack" style={{ gap: "0.15rem" }}>
        <div className="badge-list">
          <span className="pill">Admin</span>
          <span className="pill pill-outline">{title}</span>
        </div>
        <h2 style={{ margin: 0 }}>{title}</h2>
        <p className="muted" style={{ margin: 0 }}>
          {description}
        </p>
      </div>
      <div className="stack" style={{ gap: "0.35rem" }}>
        <StatusPill ok={ok} label={ok ? "Healthy" : "Check settings"} />
        {meta && <div className="muted tiny">{JSON.stringify(meta)}</div>}
        {detail && <div className="status-error">{detail}</div>}
        {!detail && !ok && <div className="status-info">Still waiting for configuration.</div>}
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
        setLastUpdated(payload.checked_at ? new Date(payload.checked_at) : new Date());
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
    <AuthWall
      title="Admin system panel is protected"
      description="Login with admin permissions to view system checks and metrics."
    >
      <section className="stack" style={{ gap: "0.85rem" }}>
        <div className="badge-list">
          <span className="pill">Admin</span>
          <span className="pill pill-outline">System</span>
        </div>
        <h1 style={{ margin: 0 }}>System checks</h1>
        <p className="muted" style={{ margin: 0 }}>
          Health, SMTP, and AI readiness for this deployment. Metrics mirror the backend status endpoint.
        </p>

        <div className="pill-row" style={{ alignItems: "center", gap: "0.5rem" }}>
          <button type="button" className="pill" onClick={load} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh now"}
          </button>
          {lastUpdated && (
            <span className="tiny muted">
              Updated {lastUpdated.toLocaleTimeString()} ({lastUpdated.toLocaleDateString()})
            </span>
          )}
        </div>

        {loading && <div className="status-info">Loading live status…</div>}
        {error && <div className="status-error">{error}</div>}

        {!loading && !error && data && (
          <section className="glass stack" style={{ gap: "0.4rem" }}>
            <div className="pill-row" style={{ gap: "0.35rem", flexWrap: "wrap", alignItems: "center" }}>
              <StatusPill
                ok={overallHealthy}
                label={overallHealthy ? "All systems healthy" : "Some checks need attention"}
              />
              <span className="pill pill-outline">Env: {environment}</span>
              <span className="pill pill-outline">Version: {version}</span>
              {lastUpdated && (
                <span className="tiny muted">
                  Checked {lastUpdated.toLocaleTimeString()} ({lastUpdated.toLocaleDateString()})
                </span>
              )}
            </div>
            <p className="muted small" style={{ margin: 0 }}>
              Overall status is based on database connectivity, SMTP readiness, and AI configuration.
            </p>
          </section>
        )}

        {!loading && !error && data && (
          <div className="grid three" style={{ gap: "1rem" }}>
            {cards.map((card) => (
              <StatusCard key={card.key} title={card.title} description={card.description} status={card.status} />
            ))}
          </div>
        )}

        {!loading && !error && data?.metrics && (
          <section className="glass stack" style={{ gap: "0.4rem" }}>
            <div className="badge-list">
              <span className="pill">Admin</span>
              <span className="pill pill-outline">Metrics</span>
            </div>
            <h2 style={{ margin: 0 }}>Latency buckets</h2>
            <p className="muted" style={{ margin: 0 }}>
              Rounded API latency counts surfaced by the backend. Use this to spot spikes or cold starts.
            </p>
            <div className="pill-row">
              {Object.entries(data.metrics).map(([bucket, count]) => (
                <span key={bucket} className="pill pill-soft">
                  {bucket}: {count}
                </span>
              ))}
            </div>
          </section>
        )}
      </section>
    </AuthWall>
  );
}
