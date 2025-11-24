"use client";

import { useEffect, useMemo, useState } from "react";

import { bearerHeaders, loadTokens } from "../../../lib/auth";
import { apiUrl } from "../../../lib/api";

const initialForm = { type: "", description: "", status: "open" };

export default function CreateIncidentPage() {
  const [form, setForm] = useState(initialForm);
  const [tokens, setTokens] = useState(null);
  const [state, setState] = useState({ status: "idle" });

  const submitUrl = useMemo(() => apiUrl("/incidents"), []);

  useEffect(() => {
    setTokens(loadTokens());
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!tokens) {
      setState({ status: "error", message: "Please sign in first" });
      return;
    }

    setState({ status: "loading" });
    try {
      const res = await fetch(submitUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...bearerHeaders(tokens),
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        const message = payload?.detail || `Request failed (${res.status})`;
        setState({ status: "error", message });
        return;
      }

      const data = await res.json();
      setForm(initialForm);
      setState({ status: "success", payload: data, message: "Incident created" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create incident";
      setState({ status: "error", message });
    }
  };

  const resetForm = () => setForm(initialForm);

  return (
    <section className="grid" style={{ gap: "1.5rem" }}>
      <div className="stack">
        <div className="badge-list">
          <span className="pill">Incidents</span>
          <span className="pill pill-warning">Workflow</span>
        </div>
        <h1 style={{ margin: 0 }}>Create incident</h1>
        <p className="muted" style={{ margin: 0 }}>
          Submit to <code>{submitUrl}</code>. The backend derives <code>company_id</code> and
          <code>user_id</code> from your bearer token.
        </p>
      </div>

      <div className="card grid" style={{ gap: "1rem" }}>
        <form className="grid" style={{ gap: "0.75rem" }} onSubmit={handleSubmit}>
          <label>
            Title / Type
            <input
              name="type"
              placeholder="Safety, security, compliance..."
              required
              value={form.type}
              onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}
            />
          </label>
          <label>
            Description
            <textarea
              name="description"
              rows={4}
              placeholder="What happened?"
              required
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            />
          </label>
          <label>
            Status
            <select
              name="status"
              value={form.status}
              onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
            >
              <option value="open">Open</option>
              <option value="in_review">In review</option>
              <option value="escalated">Escalated</option>
            </select>
          </label>

          <div className="grid two-col" style={{ gap: "0.5rem" }}>
            <button type="submit" disabled={state.status === "loading"}>
              {state.status === "loading" ? "Submitting…" : "Save incident"}
            </button>
            <button type="button" className="ghost" onClick={resetForm}>
              Reset form
            </button>
          </div>
        </form>

        {state.status === "idle" && (
          <div className="tiny muted">
            <div className="divider" />
            Tenant scoping is enforced API-side; the UI only collects the payload and sends your bearer token.
          </div>
        )}

        {state.status === "error" && <div className="status-error">{state.message}</div>}

        {state.status === "success" && (
          <div className="card surface stack" style={{ gap: "0.5rem" }}>
            <strong>Incident created</strong>
            <p className="tiny muted" style={{ margin: 0 }}>
              Response from the backend is shown below so you can verify company/user scoping.
            </p>
            <pre className="code-block tiny" style={{ whiteSpace: "pre-wrap" }}>
{JSON.stringify(state.payload, null, 2)}
            </pre>
          </div>
        )}

        {!tokens && <div className="status-info">Sign in first to include your bearer token.</div>}
      </div>
    </section>
  );
}
