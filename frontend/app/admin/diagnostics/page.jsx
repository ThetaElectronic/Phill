"use client";

import { useEffect, useMemo, useState } from "react";

import AuthWall from "../../../components/AuthWall";
import { fetchWithAuth, apiUrl } from "../../../lib/api";

function DetailCard({ title, description, children }) {
  return (
    <section className="card surface stack" style={{ gap: "0.5rem" }}>
      <div className="stack" style={{ gap: "0.1rem" }}>
        <div className="badge-list">
          <span className="pill">Admin</span>
          <span className="pill pill-outline">Diagnostics</span>
        </div>
        <h2 style={{ margin: 0 }}>{title}</h2>
        {description && (
          <p className="muted tiny" style={{ margin: 0 }}>
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

function StatusList({ status }) {
  if (!status) return null;
  const items = [
    { key: "database", label: "Database", data: status.database },
    { key: "email", label: "Email", data: status.email },
    { key: "ai", label: "AI", data: status.ai },
  ];
  return (
    <div className="stack" style={{ gap: "0.35rem" }}>
      {items.map((item) => (
        <div key={item.key} className="chip-row" style={{ gap: "0.4rem", alignItems: "center", flexWrap: "wrap" }}>
          <span className="pill">{item.label}</span>
          <span className={item.data?.ok ? "pill pill-success" : "pill pill-outline"}>
            {item.data?.ok ? "Healthy" : "Needs attention"}
          </span>
          {item.data?.detail && <span className="tiny muted">{item.data.detail}</span>}
          {item.data?.model && <span className="pill pill-soft">Model: {item.data.model}</span>}
          {item.data?.metrics && (
            <span className="tiny muted">
              Metrics: {Object.entries(item.data.metrics).map(([bucket, count]) => `${bucket}:${count}`).join(" · ")}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

export default function AdminDiagnosticsPage() {
  const [adminStatus, setAdminStatus] = useState(null);
  const [aiStatus, setAiStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const endpoints = useMemo(
    () => ({
      health: apiUrl("/health"),
      adminStatus: apiUrl("/admin/status"),
      aiStatus: apiUrl("/ai/status"),
      login: apiUrl("/auth/login"),
      chat: apiUrl("/ai/chat"),
      upload: apiUrl("/ai/documents"),
    }),
    [],
  );

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [adminRes, aiRes] = await Promise.all([
        fetchWithAuth("/api/admin/status"),
        fetch(endpoints.aiStatus),
      ]);

      if (!adminRes.ok) {
        throw new Error(await adminRes.text());
      }

      const adminPayload = await adminRes.json();
      const aiPayload = aiRes.ok ? await aiRes.json() : null;

      setAdminStatus(adminPayload);
      setAiStatus(aiPayload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load diagnostics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const envLabel = adminStatus?.environment || "unknown";
  const versionLabel = adminStatus?.version || "dev";
  const overallOk = adminStatus?.status === "ok";
  const hasAdminData = Boolean(adminStatus);

  return (
    <AuthWall title="Admin diagnostics are protected" description="Sign in with admin permissions to view deployment details.">
      <section className="stack" style={{ gap: "1rem" }}>
        <div className="card glass stack" style={{ gap: "0.5rem" }}>
          <div className="stack" style={{ gap: "0.1rem" }}>
            <div className="badge-list">
              <span className="pill">Admin</span>
              <span className="pill pill-outline">Diagnostics</span>
            </div>
            <h1 style={{ margin: 0 }}>Diagnostics</h1>
            <p className="muted" style={{ margin: 0 }}>
              Technical details, endpoints, and health payloads live here instead of cluttering the main UI.
            </p>
          </div>
          <div className="chip-row" style={{ gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
            <button type="button" className="secondary" onClick={load} disabled={loading}>
              {loading ? "Refreshing…" : "Refresh"}
            </button>
            {hasAdminData && (
              <span className={overallOk ? "pill pill-success" : "pill pill-outline"}>
                {overallOk ? "All systems healthy" : "Checks need attention"}
              </span>
            )}
            <span className="pill pill-outline">Env: {envLabel}</span>
            <span className="pill pill-outline">Version: {versionLabel}</span>
          </div>
          {error && <div className="status-error">{error}</div>}
          {!error && !loading && hasAdminData && !overallOk && (
            <div className="status-info">Some checks are down or misconfigured. See details below.</div>
          )}
        </div>

        <DetailCard title="Health checks" description="Raw admin status, including database, email, and AI readiness.">
          {loading && <div className="status-info">Loading…</div>}
          {!loading && <StatusList status={adminStatus} />}
          {adminStatus?.checked_at && (
            <span className="tiny muted">Checked at {new Date(adminStatus.checked_at).toLocaleString()}</span>
          )}
        </DetailCard>

        <DetailCard title="AI readiness" description="Direct response from the AI status probe.">
          {loading && <div className="status-info">Loading…</div>}
          {!loading && aiStatus && (
            <div className="stack" style={{ gap: "0.35rem" }}>
              <div className="chip-row" style={{ gap: "0.35rem", alignItems: "center", flexWrap: "wrap" }}>
                <span className={aiStatus.ok ? "pill pill-success" : "pill pill-outline"}>
                  {aiStatus.ok ? "Ready" : "Not ready"}
                </span>
                {aiStatus.detail && <span className="tiny muted">{aiStatus.detail}</span>}
                {aiStatus.model && <span className="pill pill-soft">Model: {aiStatus.model}</span>}
              </div>
              <pre className="code-block" style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                {JSON.stringify(aiStatus, null, 2)}
              </pre>
            </div>
          )}
        </DetailCard>

        <DetailCard title="API endpoints" description="Useful routes for testing login, AI, and uploads.">
          <div className="grid two-col" style={{ gap: "0.5rem" }}>
            {Object.entries(endpoints).map(([key, value]) => (
              <div key={key} className="stack" style={{ gap: "0.15rem" }}>
                <span className="tiny muted">{key}</span>
                <code style={{ wordBreak: "break-all" }}>{value}</code>
              </div>
            ))}
          </div>
        </DetailCard>

        <DetailCard title="Raw payloads" description="Exact JSON returned by the backend for deeper debugging.">
          <div className="grid two-col" style={{ gap: "0.75rem" }}>
            <div className="stack" style={{ gap: "0.25rem" }}>
              <span className="tiny muted">Admin status</span>
              <pre className="code-block" style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                {JSON.stringify(adminStatus, null, 2)}
              </pre>
            </div>
            <div className="stack" style={{ gap: "0.25rem" }}>
              <span className="tiny muted">AI status</span>
              <pre className="code-block" style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                {JSON.stringify(aiStatus, null, 2)}
              </pre>
            </div>
          </div>
        </DetailCard>
      </section>
    </AuthWall>
  );
}
