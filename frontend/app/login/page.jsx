"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { clearTokens, loadTokens, storeTokens } from "../../lib/auth";
import { apiUrl } from "../../lib/api";

const initialForm = { email: "", password: "" };

function InlineActions({ onReset }) {
  const [email, setEmail] = useState("");
  const [requestEmail, setRequestEmail] = useState("");
  const [message, setMessage] = useState(null);
  const [status, setStatus] = useState({ state: "idle" });

  const handleAction = async (path, payload, successMessage) => {
    setStatus({ state: "loading" });
    setMessage(null);
    try {
      const res = await fetch(apiUrl(path), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let detail = "Unable to submit";
        try {
          const body = await res.json();
          if (body?.detail) detail = Array.isArray(body.detail) ? body.detail[0]?.msg || detail : body.detail;
        } catch (error) {
          try {
            const text = await res.text();
            if (text) detail = `${detail}: ${text.slice(0, 200)}`;
          } catch {}
        }
        setStatus({ state: "error", message: detail });
        return;
      }

      setStatus({ state: "success" });
      setMessage(successMessage);
      onReset?.();
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Unexpected error";
      setStatus({ state: "error", message: detail });
    }
  };

  const handleForgot = (event) => {
    event.preventDefault();
    handleAction("/auth/request-reset", { email }, "If this email exists, a reset link will be sent.");
  };

  const handleRequest = (event) => {
    event.preventDefault();
    handleAction("/auth/request-access", { email: requestEmail }, "We received your access request.");
  };

  return (
    <div className="card glass minimal-actions">
      <div className="stack" style={{ gap: "0.5rem" }}>
        <h3 style={{ margin: 0 }}>Need help?</h3>
        <p className="muted tiny" style={{ margin: 0 }}>
          Forgot your password or need an invite? Use the quick actions below. Everything else stays hidden until you sign in.
        </p>
      </div>
      <div className="grid two-col" style={{ gap: "0.75rem" }}>
        <form className="stack" onSubmit={handleForgot} style={{ gap: "0.35rem" }}>
          <label className="stack" style={{ gap: "0.25rem" }}>
            Reset link
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>
          <button type="submit" className="ghost">
            Send reset
          </button>
        </form>

        <form className="stack" onSubmit={handleRequest} style={{ gap: "0.35rem" }}>
          <label className="stack" style={{ gap: "0.25rem" }}>
            Request access
            <input
              type="email"
              required
              value={requestEmail}
              onChange={(event) => setRequestEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>
          <button type="submit" className="ghost">
            Send request
          </button>
        </form>
      </div>
      {message && <div className="status-info">{message}</div>}
      {status.state === "error" && <div className="status-error">{status.message}</div>}
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams?.get("next") || "/dashboard";
  const tokenUrl = useMemo(() => apiUrl("/auth/token"), []);
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState({ state: "idle" });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ state: "loading" });

    try {
      const body = new URLSearchParams();
      body.set("username", form.email);
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
          try {
            const text = await res.text();
            if (text) message = `${message}: ${text.slice(0, 200)}`;
          } catch {}
        }
        setStatus({ state: "error", message });
        return;
      }

      const data = await res.json();
      storeTokens(data);
      setStatus({ state: "success", message: "Signed in" });
      router.push(nextPath || "/dashboard");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error";
      setStatus({ state: "error", message });
    }
  };

  return (
    <div className="login-wrap">
      <div className="card glass stack login-card">
        <div className="stack" style={{ gap: "0.35rem" }}>
          <span className="pill soft">Phill</span>
          <h1 style={{ margin: 0 }}>Sign in</h1>
          <p className="muted" style={{ margin: 0 }}>
            Use your work email to enter the workspace. Everything stays hidden until you authenticate.
          </p>
        </div>
        <form className="grid" style={{ gap: "0.85rem" }} onSubmit={handleSubmit}>
          <label className="stack" style={{ gap: "0.35rem" }}>
            Email
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            />
          </label>
          <label className="stack" style={{ gap: "0.35rem" }}>
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
          <button type="submit" disabled={status.state === "loading"}>
            {status.state === "loading" ? "Signing in…" : "Sign in"}
          </button>
        </form>
        {status.state === "error" && <div className="status-error">{status.message || "Unable to sign in"}</div>}
        {status.state === "success" && <div className="status-success">Redirecting…</div>}
      </div>
      <InlineActions onReset={() => clearTokens()} />
    </div>
  );
}

export default function LoginPage() {
  const existingTokens = loadTokens();
  const [hasTokens] = useState(Boolean(existingTokens));

  return (
    <section className="grid" style={{ gap: "1.5rem" }}>
      <LoginForm />
      {hasTokens && <div className="status-info">Stored session detected. Sign in again to refresh.</div>}
    </section>
  );
}
