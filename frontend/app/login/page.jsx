"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { clearTokens, loadTokens, storeTokens } from "../../lib/auth";
import { apiUrl, getApiBase } from "../../lib/api";

const initialForm = { email: "", password: "" };

function ForgotRequestPanels({ onReset }) {
  const [email, setEmail] = useState("");
  const [requestEmail, setRequestEmail] = useState("");
  const [message, setMessage] = useState(null);

  const handleForgot = (event) => {
    event.preventDefault();
    setMessage("If this email exists, a reset link will be sent.");
    onReset?.();
  };

  const handleRequest = (event) => {
    event.preventDefault();
    setMessage("We received your access request.");
    onReset?.();
  };

  return (
    <div className="grid two-col" style={{ gap: "1rem" }}>
      <form className="card surface stack" onSubmit={handleForgot} style={{ gap: "0.75rem" }}>
        <div className="stack" style={{ gap: "0.35rem" }}>
          <h3 style={{ margin: 0 }}>Forgot password</h3>
          <p className="muted tiny" style={{ margin: 0 }}>
            Enter your email to receive a reset link.
          </p>
        </div>
        <label className="stack" style={{ gap: "0.35rem" }}>
          Email
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

      <form className="card surface stack" onSubmit={handleRequest} style={{ gap: "0.75rem" }}>
        <div className="stack" style={{ gap: "0.35rem" }}>
          <h3 style={{ margin: 0 }}>Request access</h3>
          <p className="muted tiny" style={{ margin: 0 }}>
            Ask an admin to invite you. We will notify them with your email.
          </p>
        </div>
        <label className="stack" style={{ gap: "0.35rem" }}>
          Work email
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
      {message && <div className="status-info" style={{ gridColumn: "1 / -1" }}>{message}</div>}
    </div>
  );
}

function LoginForm() {
  const apiBase = getApiBase();
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
    <div className="stack" style={{ gap: "1.25rem" }}>
      <div className="card glass stack" style={{ gap: "0.9rem", padding: "1.75rem" }}>
        <div className="stack" style={{ gap: "0.35rem" }}>
          <span className="pill soft">Phill</span>
          <h1 style={{ margin: 0 }}>Sign in</h1>
          <p className="muted" style={{ margin: 0 }}>
            A clean, private entry point. Use your work email and password to access the workspace.
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
        <div className="tiny muted">API: {apiBase}</div>
        {status.state === "error" && <div className="status-error">{status.message || "Unable to sign in"}</div>}
        {status.state === "success" && <div className="status-success">Redirecting…</div>}
      </div>
      <ForgotRequestPanels onReset={() => clearTokens()} />
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
