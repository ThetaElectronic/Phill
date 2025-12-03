"use client";

import { useEffect, useMemo, useState } from "react";

import AdminWall from "../../../components/AdminWall";
import { fetchWithAuth } from "../../../lib/api";

export default function AdminEmailPage() {
  const [recipient, setRecipient] = useState("");
  const [status, setStatus] = useState({ state: "idle", message: "" });
  const [config, setConfig] = useState({ state: "loading" });
  const hasRecipient = useMemo(() => recipient.trim().length > 0, [recipient]);

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const res = await fetchWithAuth("/api/admin/email/status", { headers: { Accept: "application/json" } });
        if (!res.ok) {
          setConfig({ state: "error", message: "Unable to load SMTP status" });
          return;
        }
        const data = await res.json();
        setConfig({ state: data?.ok ? "ok" : "missing", detail: data?.detail, settings: data?.settings });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to load status";
        setConfig({ state: "error", message });
      }
    };

    loadStatus();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!hasRecipient) return;
    setStatus({ state: "loading" });

    try {
      const res = await fetchWithAuth("/api/admin/email/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient }),
      });

      if (!res.ok) {
        let detail = "Unable to send";
        try {
          const payload = await res.json();
          if (payload?.detail) detail = payload.detail;
        } catch (error) {
          try {
            const text = await res.text();
            if (text) detail = `${detail}: ${text.slice(0, 120)}`;
          } catch {}
        }
        setStatus({ state: "error", message: detail });
        return;
      }

      setStatus({ state: "success", message: "Test email sent" });
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Unexpected error";
      setStatus({ state: "error", message: detail });
    }
  };

  return (
    <AdminWall title="Email admin" description="Send a test message using the configured SMTP credentials.">
      <section className="stack" style={{ gap: "1rem", maxWidth: "720px" }}>
        <div className="stack" style={{ gap: "0.35rem" }}>
          <div className="badge-list">
            <span className="pill">Admin</span>
            <span className="pill pill-outline">Email</span>
          </div>
          <h1 style={{ margin: 0 }}>Send a test email</h1>
          <p className="muted" style={{ margin: 0 }}>
            Use this form to verify SMTP credentials before enabling password reset and request notifications.
          </p>
          {config.state === "missing" && (
            <div className="status-error">{config.detail || "SMTP credentials are missing."}</div>
          )}
          {config.state === "ok" && config.settings && (
            <div className="tiny muted" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <span className="pill pill-outline">Host: {config.settings.host}</span>
              <span className="pill pill-outline">From: {config.settings.from}</span>
              {config.settings.use_tls && <span className="pill pill-outline">TLS</span>}
              {config.settings.starttls && !config.settings.use_tls && <span className="pill pill-outline">STARTTLS</span>}
            </div>
          )}
        </div>

        <form className="glass card stack" style={{ gap: "0.75rem" }} onSubmit={handleSubmit}>
          <label className="stack" style={{ gap: "0.35rem" }}>
            Recipient
            <input
              type="email"
              required
              value={recipient}
              onChange={(event) => setRecipient(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>
          <button
            type="submit"
            disabled={
              !hasRecipient ||
              status.state === "loading" ||
              (config.state && config.state !== "ok")
            }
          >
            {status.state === "loading" ? "Sending…" : "Send test"}
          </button>

          <div className="tiny muted">
            The backend will deliver a plaintext message titled "Phill test email" using the configured SMTP host.
          </div>

          {status.state === "success" && <div className="status-success">{status.message}</div>}
          {status.state === "error" && <div className="status-error">{status.message}</div>}
        </form>
      </section>
    </AdminWall>
  );
}
