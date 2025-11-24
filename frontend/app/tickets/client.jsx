"use client";

import { useEffect, useMemo, useState } from "react";

import AuthWall from "../../components/AuthWall";
import { fetchWithAuth, apiUrl } from "../../lib/api";
import { loadTokens } from "../../lib/auth";

export default function TicketsClient({ session }) {
  const [tokens] = useState(() => session || loadTokens());
  const [tickets, setTickets] = useState([]);
  const [state, setState] = useState({ status: "idle" });
  const listUrl = useMemo(() => apiUrl("/tickets"), []);

  useEffect(() => {
    if (!tokens) return;
    let cancelled = false;
    const fetchTickets = async () => {
      setState({ status: "loading" });
      try {
        const res = await fetchWithAuth("/tickets", { headers: { Accept: "application/json" } });
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          const message = payload?.detail || `Request failed (${res.status})`;
          if (!cancelled) setState({ status: "error", message });
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setTickets(data || []);
          setState({ status: "success" });
        }
      } catch (error) {
        if (!cancelled)
          setState({ status: "error", message: error instanceof Error ? error.message : "Unable to load tickets" });
      }
    };
    fetchTickets();
    return () => {
      cancelled = true;
    };
  }, [tokens]);

  return (
    <AuthWall session={tokens} title="Tickets are protected" description="Sign in to view company tickets.">
      <section className="grid" style={{ gap: "1.5rem" }}>
        <div className="stack" style={{ gap: "0.35rem" }}>
          <div className="badge-list">
            <span className="pill">Tickets</span>
            <span className="pill pill-outline">Messages</span>
          </div>
          <h1 style={{ margin: 0 }}>Tickets</h1>
          <p className="muted" style={{ margin: 0 }}>
            Listing tickets from <code>{listUrl}</code> scoped to your company and role permissions.
          </p>
        </div>

        <div className="card stack" style={{ gap: "0.75rem" }}>
          {state.status === "loading" && <div className="status-info">Loading tickets…</div>}
          {state.status === "error" && <div className="status-error">{state.message}</div>}
          {state.status === "success" && tickets.length === 0 && <div className="muted tiny">No tickets yet.</div>}
          {state.status === "success" && tickets.length > 0 && (
            <div className="grid" style={{ gap: "0.5rem" }}>
              {tickets.map((ticket) => (
                <div key={ticket.id} className="card surface stack" style={{ gap: "0.35rem" }}>
                  <div className="badge-list">
                    <span className="pill">{ticket.subject}</span>
                    <span className="pill pill-outline tiny">{ticket.status}</span>
                  </div>
                  <div className="tiny muted">{ticket.message}</div>
                  <div className="tiny muted">Company: {ticket.company_id}</div>
                  <div className="tiny muted">Owner: {ticket.user_id}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </AuthWall>
  );
}
