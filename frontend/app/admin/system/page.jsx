"use client";

import { useEffect, useMemo, useState } from "react";

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

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetchWithAuth("/api/admin/status");
        if (!res.ok) {
          throw new Error(await res.text());
        }
        const payload = await res.json();
        if (mounted) setData(payload);
      } catch (err) {
        if (mounted) setError(err.message || "Unable to load status");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

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

        {loading && <div className="status-info">Loading live status…</div>}
        {error && <div className="status-error">{error}</div>}

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
