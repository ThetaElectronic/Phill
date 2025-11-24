"use client";

import { useEffect, useMemo, useState } from "react";

import { bearerHeaders, loadTokens } from "../../../lib/auth";
import { apiUrl } from "../../../lib/api";

function StatusBadge({ status }) {
  if (!status) return null;
  return <span className="pill pill-outline tiny">{status}</span>;
}

function IncidentCard({ incident }) {
  return (
    <div className="card surface stack" style={{ gap: "0.5rem" }}>
      <div className="stack" style={{ gap: "0.25rem" }}>
        <div className="badge-list">
          <span className="pill">{incident.type || "Incident"}</span>
          <StatusBadge status={incident.status} />
        </div>
        <strong>#{incident.id}</strong>
      </div>
      <p className="muted" style={{ margin: 0 }}>{incident.description || "No description"}</p>
      <div className="tiny muted grid" style={{ gap: "0.1rem" }}>
        <div>Reported by: {incident.user_id}</div>
        <div>Company: {incident.company_id}</div>
      </div>
    </div>
  );
}

export default function ReviewIncidentsPage() {
  const [tokens, setTokens] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [state, setState] = useState({ status: "idle" });

  const listUrl = useMemo(() => apiUrl("/incidents"), []);

  useEffect(() => {
    setTokens(loadTokens());
  }, []);

  useEffect(() => {
    if (!tokens) return;
    let cancelled = false;
    const fetchIncidents = async () => {
      setState({ status: "loading" });
      try {
        const res = await fetch(listUrl, { headers: { ...bearerHeaders(tokens) } });
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          const message = payload?.detail || `Request failed (${res.status})`;
          if (!cancelled) setState({ status: "error", message });
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setIncidents(data || []);
          setState({ status: "success" });
        }
      } catch (error) {
        if (!cancelled) setState({ status: "error", message: error instanceof Error ? error.message : "Unable to load incidents" });
      }
    };
    fetchIncidents();
    return () => {
      cancelled = true;
    };
  }, [listUrl, tokens]);

  const needsAuth = !tokens;

  return (
    <section className="grid" style={{ gap: "1.5rem" }}>
      <div className="stack">
        <div className="badge-list">
          <span className="pill">Incidents</span>
          <span className="pill pill-outline">Review</span>
        </div>
        <h1 style={{ margin: 0 }}>Review incidents</h1>
        <p className="muted" style={{ margin: 0 }}>
          This view fetches live incidents from <code>{listUrl}</code>. You’ll only see incidents for your company, and
          non-supervisors will be restricted to their own reports.
        </p>
      </div>

      <div className="card stack" style={{ gap: "1rem" }}>
        <div className="stack" style={{ gap: "0.25rem" }}>
          <h2 style={{ margin: 0 }}>Incoming queue</h2>
          <p className="muted tiny" style={{ margin: 0 }}>
            Requires a valid bearer token. Log in, then refresh this page to pull your company’s incidents.
          </p>
        </div>
        <div className="divider" />

        {needsAuth && <div className="status-info">Sign in to load incidents. Tokens are stored locally.</div>}

        {state.status === "loading" && <div className="status-info">Loading incidents…</div>}

        {state.status === "error" && <div className="status-error">{state.message || "Unable to load incidents"}</div>}

        {state.status === "success" && incidents.length === 0 && (
          <div className="muted tiny">No incidents to show yet.</div>
        )}

        {state.status === "success" && incidents.length > 0 && (
          <div className="grid" style={{ gap: "0.75rem" }}>
            {incidents.map((incident) => (
              <IncidentCard key={incident.id} incident={incident} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
