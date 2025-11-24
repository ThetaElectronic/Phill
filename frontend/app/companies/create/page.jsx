"use client";

import { useState } from "react";

import AuthWall from "../../../components/AuthWall";
import { bearerHeaders, loadTokens } from "../../../lib/auth";
import { apiUrl } from "../../../lib/api";

export default function CreateCompanyPage() {
  const [form, setForm] = useState({ name: "", domain: "" });
  const [state, setState] = useState({ status: "idle" });
  const [tokens] = useState(() => loadTokens());
  const createUrl = apiUrl("/companies");

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!tokens) {
      setState({ status: "error", message: "Login with company-owner permissions first" });
      return;
    }

    setState({ status: "loading" });
    try {
      const res = await fetch(createUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...bearerHeaders(tokens) },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        const message = payload?.detail || `Request failed (${res.status})`;
        setState({ status: "error", message });
        return;
      }
      const data = await res.json();
      setState({ status: "success", payload: data });
    } catch (error) {
      setState({ status: "error", message: error instanceof Error ? error.message : "Unable to create company" });
    }
  };

  return (
    <AuthWall title="Company creation is protected" description="Only owner-level users can create companies. Please log in first.">
      <section className="grid" style={{ gap: "1.25rem" }}>
        <div className="stack">
          <div className="badge-list">
            <span className="pill">Companies</span>
            <span className="pill pill-outline">Owner role</span>
          </div>
          <h1 style={{ margin: 0 }}>Create company</h1>
          <p className="muted" style={{ margin: 0 }}>
            POST to <code>{createUrl}</code> with your bearer token. Only owner-level accounts can create companies.
          </p>
        </div>

        <div className="card stack" style={{ gap: "0.75rem" }}>
          <form className="grid" style={{ gap: "0.75rem" }} onSubmit={handleSubmit}>
            <label>
              Name
              <input
                name="name"
                required
                placeholder="Acme Corp"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              />
            </label>
            <label>
              Domain
              <input
                name="domain"
                required
                placeholder="acme.com"
                value={form.domain}
                onChange={(event) => setForm((prev) => ({ ...prev, domain: event.target.value }))}
              />
            </label>

            <button type="submit" disabled={state.status === "loading"}>
              {state.status === "loading" ? "Creating…" : "Create company"}
            </button>
          </form>

          {state.status === "error" && <div className="status-error">{state.message}</div>}
          {state.status === "success" && (
            <div className="card surface stack" style={{ gap: "0.35rem" }}>
              <div className="pill pill-success" style={{ width: "fit-content" }}>
                Company created
              </div>
              <pre className="code-block tiny" style={{ whiteSpace: "pre-wrap" }}>
{JSON.stringify(state.payload, null, 2)}
              </pre>
            </div>
          )}
          {!tokens && <div className="status-info">Sign in with company-owner permissions to create companies.</div>}
        </div>
      </section>
    </AuthWall>
  );
}
