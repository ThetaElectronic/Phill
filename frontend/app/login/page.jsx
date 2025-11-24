"use client";

import { useEffect, useMemo, useState } from "react";

import { apiUrl, getApiBase } from "../../lib/api";

const initialForm = { username: "", password: "" };

export default function LoginPage() {
  const apiBase = getApiBase();
  const tokenUrl = useMemo(() => apiUrl("/auth/token"), []);
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState({ state: "idle" });
  const [tokens, setTokens] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("phill_tokens");
    if (stored) {
      try {
        setTokens(JSON.parse(stored));
      } catch {
        window.localStorage.removeItem("phill_tokens");
      }
    }
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ state: "loading" });

    try {
      const body = new URLSearchParams();
      body.set("username", form.username);
      body.set("password", form.password);

      const res = await fetch(tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });

      if (!res.ok) {
        let message = "Login failed";
        try {
          const payload = await res.json();
          if (payload?.detail) message = Array.isArray(payload.detail) ? payload.detail[0]?.msg || message : payload.detail;
        } catch (error) {
          if (error instanceof Error) message = `${message}: ${error.message}`;
        }
        setStatus({ state: "error", message });
        return;
      }

      const data = await res.json();
      setTokens(data);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("phill_tokens", JSON.stringify(data));
      }
      setStatus({ state: "success", message: "Tokens received. Include the bearer token on API calls." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error";
      setStatus({ state: "error", message });
    }
  };

  const resetTokens = () => {
    setTokens(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("phill_tokens");
    }
  };

  return (
    <section className="grid" style={{ gap: "1.5rem" }}>
      <div className="stack">
        <div className="badge-list">
          <span className="pill">Authentication</span>
          <span className="pill pill-outline">JWT + refresh</span>
        </div>
        <h1 style={{ margin: 0 }}>Sign in to Phill</h1>
        <p className="muted" style={{ margin: 0 }}>
          Use your company username and password. Token refresh and role-based access control are wired
          on the backend; this form now calls the live token endpoint configured by
          <code>NEXT_PUBLIC_API_URL</code>.
        </p>
      </div>

      <div className="card grid" style={{ gap: "1rem" }}>
        <div className="stack">
          <h2 style={{ margin: 0 }}>Credentials</h2>
          <span className="muted tiny">
            Tokens are requested from <code>{tokenUrl}</code> using the OAuth2 password grant expected by
            the backend.
          </span>
        </div>
        <form className="grid" style={{ gap: "0.75rem" }} onSubmit={handleSubmit}>
          <label>
            Username
            <input
              type="text"
              name="username"
              placeholder="founder | manager | user"
              autoComplete="username"
              required
              value={form.username}
              onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              autoComplete="current-password"
              required
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            />
          </label>
          <div className="grid" style={{ gap: "0.5rem" }}>
            <button type="submit" disabled={status.state === "loading"}>
              {status.state === "loading" ? "Requesting tokens…" : "Sign in"}
            </button>
            <div className="tiny muted">
              API base: <code>{apiBase}</code>
            </div>
          </div>
        </form>
        {status.state === "success" && tokens && (
          <div className="card surface">
            <div className="stack" style={{ gap: "0.25rem" }}>
              <strong>Tokens stored locally</strong>
              <span className="tiny muted">
                Use the access token as <code>Authorization: Bearer {'<token>'}</code>. Refresh tokens are
                returned for manual testing.
              </span>
            </div>
            <pre className="code-block tiny" style={{ whiteSpace: "pre-wrap" }}>
{JSON.stringify(tokens, null, 2)}
            </pre>
            <div className="cta-links">
              <button type="button" className="ghost" onClick={resetTokens}>
                Clear stored tokens
              </button>
            </div>
          </div>
        )}

        {status.state === "error" && (
          <div className="status-error">
            {status.message || "Unable to sign in"}
          </div>
        )}

        {status.state === "loading" && <div className="status-info">Authenticating…</div>}

        <div className="tiny muted grid" style={{ gap: "0.25rem" }}>
          <div className="divider" />
          <div>Roles are enforced by the backend. Supervisors and above can mint users via the API.</div>
          <div>
            Health check: <code>{apiUrl("/health")}</code> · Backend token endpoint: <code>{tokenUrl}</code>
          </div>
        </div>
      </div>
    </section>
  );
}
