"use client";

import { useEffect, useState } from "react";

import { fetchWithAuth } from "../../../lib/api";

function RequestsCard({ title, description, items, loading, error }) {
  return (
    <section className="glass stack" style={{ gap: "0.75rem" }}>
      <div className="stack" style={{ gap: "0.25rem" }}>
        <div className="badge-list">
          <span className="pill">Admin</span>
          <span className="pill pill-outline">{title}</span>
        </div>
        <div className="stack" style={{ gap: "0.1rem" }}>
          <h2 style={{ margin: 0 }}>{title}</h2>
          <p className="muted" style={{ margin: 0 }}>
            {description}
          </p>
        </div>
      </div>
      {loading && <div className="muted">Loading…</div>}
      {error && (
        <div className="status error">
          <strong>Could not load</strong>
          <div className="muted tiny">{error}</div>
        </div>
      )}
      {!loading && !error && items?.length === 0 && (
        <div className="status muted">No entries yet.</div>
      )}
      {!loading && !error && items?.length > 0 && (
        <div className="list">
          {items.map((item) => (
            <div key={item.id} className="list-row">
              <div className="stack" style={{ gap: "0.1rem" }}>
                <div className="strong">{item.email}</div>
                {item.note && <div className="muted tiny">Note: {item.note}</div>}
                <div className="muted tiny">{new Date(item.created_at).toLocaleString()}</div>
              </div>
              <div className="stack" style={{ alignItems: "flex-end", gap: "0.1rem" }}>
                {item.ip_address && <span className="pill pill-outline">IP {item.ip_address}</span>}
                {item.user_agent && <span className="muted tiny truncate">{item.user_agent}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function AdminRequestsPage() {
  const [accessRequests, setAccessRequests] = useState([]);
  const [resetRequests, setResetRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [accessRes, resetRes] = await Promise.all([
          fetchWithAuth("/api/admin/requests/access"),
          fetchWithAuth("/api/admin/requests/password-resets"),
        ]);

        if (!accessRes.ok) {
          throw new Error(await accessRes.text());
        }
        if (!resetRes.ok) {
          throw new Error(await resetRes.text());
        }

        const [accessData, resetData] = await Promise.all([
          accessRes.json(),
          resetRes.json(),
        ]);

        if (mounted) {
          setAccessRequests(accessData);
          setResetRequests(resetData);
        }
      } catch (err) {
        if (mounted) setError(err.message || "Unable to load requests");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="stack" style={{ gap: "1rem" }}>
      <header className="stack" style={{ gap: "0.25rem" }}>
        <div className="pill">Admin</div>
        <h1 style={{ margin: 0 }}>Auth requests</h1>
        <p className="muted" style={{ margin: 0 }}>
          Review access requests and password reset submissions captured from the login page.
        </p>
      </header>
      <div className="grid two">
        <RequestsCard
          title="Access requests"
          description="Requests to gain access with optional notes for follow-up."
          items={accessRequests}
          loading={loading}
          error={error}
        />
        <RequestsCard
          title="Password reset requests"
          description="Recent reset submissions with metadata for auditing."
          items={resetRequests}
          loading={loading}
          error={error}
        />
      </div>
    </div>
  );
}
