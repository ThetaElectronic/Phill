"use client";

import { useEffect, useMemo, useState } from "react";

import AdminWall from "../../../components/AdminWall";
import { fetchWithAuth } from "../../../lib/api";

const TEMPLATE_KEY = "welcome_new_user";

export default function AdminEmailPage() {
  const [recipient, setRecipient] = useState("");
  const [status, setStatus] = useState({ state: "idle", message: "" });
  const [config, setConfig] = useState({ state: "loading" });
  const [template, setTemplate] = useState({ state: "loading" });
  const [saveState, setSaveState] = useState({ state: "idle", message: "" });

  const hasRecipient = useMemo(() => recipient.trim().length > 0, [recipient]);
  const templateDirty = useMemo(() => template.draft && template.data && (template.draft.subject !== template.data.subject || template.draft.body !== template.data.body), [template]);

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

    const loadTemplate = async () => {
      try {
        const res = await fetchWithAuth(`/api/admin/email/templates/${TEMPLATE_KEY}`);
        if (!res.ok) {
          setTemplate({ state: "error", message: "Unable to load template" });
          return;
        }
        const data = await res.json();
        setTemplate({ state: "ready", data, draft: { subject: data.subject, body: data.body } });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to load template";
        setTemplate({ state: "error", message });
      }
    };

    loadStatus();
    loadTemplate();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!hasRecipient || template.state !== "ready") return;
    setStatus({ state: "loading" });

    try {
      const res = await fetchWithAuth(`/api/admin/email/templates/${TEMPLATE_KEY}/test`, {
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

  const saveTemplate = async () => {
    if (!template.draft) return;
    setSaveState({ state: "saving" });
    try {
      const res = await fetchWithAuth(`/api/admin/email/templates/${TEMPLATE_KEY}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(template.draft),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        setSaveState({ state: "error", message: payload?.detail || "Unable to save template" });
        return;
      }
      const data = await res.json();
      setTemplate({ state: "ready", data, draft: { subject: data.subject, body: data.body } });
      setSaveState({ state: "success", message: "Template saved" });
    } catch (error) {
      setSaveState({ state: "error", message: error instanceof Error ? error.message : "Unable to save template" });
    }
  };

  const updateDraft = (field, value) => {
    if (template.state !== "ready" && !template.draft) return;
    setTemplate((prev) => ({
      ...prev,
      draft: { ...(prev.draft || prev.data || {}), [field]: value },
    }));
  };

  return (
    <AdminWall title="Email admin" description="Edit onboarding templates and send test emails." layout="wide">
      <section className="stack" style={{ gap: "1rem", maxWidth: "960px" }}>
        <div className="stack" style={{ gap: "0.35rem" }}>
          <div className="badge-list">
            <span className="pill">Admin</span>
            <span className="pill pill-outline">Email</span>
          </div>
          <h1 style={{ margin: 0 }}>Onboarding email</h1>
          <p className="muted" style={{ margin: 0 }}>
            Customize the welcome email sent to new users and verify delivery with a test send.
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

        <div className="card glass stack" style={{ gap: "0.75rem" }}>
          <div className="stack" style={{ gap: "0.25rem" }}>
            <h2 style={{ margin: 0 }}>Welcome template</h2>
            <p className="tiny muted" style={{ margin: 0 }}>
              This template is used when notifying users about newly created accounts.
            </p>
          </div>
          {template.state === "loading" && <div className="tiny muted">Loading template…</div>}
          {template.state === "error" && <div className="status-error">{template.message}</div>}
          {template.state !== "loading" && template.draft && (
            <>
              <label className="stack" style={{ gap: "0.35rem" }}>
                Subject
                <input
                  type="text"
                  value={template.draft.subject}
                  onChange={(event) => updateDraft("subject", event.target.value)}
                  placeholder="Welcome to Phill"
                />
              </label>
              <label className="stack" style={{ gap: "0.35rem" }}>
                Body
                <textarea
                  rows={8}
                  value={template.draft.body}
                  onChange={(event) => updateDraft("body", event.target.value)}
                  placeholder="Body for new user welcome"
                  style={{ fontFamily: "monospace" }}
                />
              </label>
              <div className="chip-row" style={{ gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                <button type="button" onClick={saveTemplate} disabled={saveState.state === "saving" || !templateDirty}>
                  {saveState.state === "saving" ? "Saving…" : "Save template"}
                </button>
                <button
                  type="button"
                  className="ghost"
                  onClick={() =>
                    template.data &&
                    setTemplate({ state: "ready", data: template.data, draft: { ...template.data } })
                  }
                  disabled={!templateDirty}
                >
                  Reset
                </button>
                {saveState.state === "success" && <span className="tiny status-success">{saveState.message}</span>}
                {saveState.state === "error" && <span className="tiny status-error">{saveState.message}</span>}
              </div>
            </>
          )}
        </div>

        <form className="glass card stack" style={{ gap: "0.75rem" }} onSubmit={handleSubmit}>
          <div className="stack" style={{ gap: "0.25rem" }}>
            <h2 style={{ margin: 0 }}>Send a test email</h2>
            <p className="tiny muted" style={{ margin: 0 }}>
              Uses the welcome template above and the configured SMTP credentials.
            </p>
          </div>
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
            disabled={!hasRecipient || status.state === "loading" || template.state !== "ready" || config.state !== "ok"}
          >
            {status.state === "loading" ? "Sending…" : "Send test"}
          </button>

          <div className="tiny muted">
            The backend will deliver your customized welcome email using the configured SMTP host.
          </div>

          {status.state === "success" && <div className="status-success">{status.message}</div>}
          {status.state === "error" && <div className="status-error">{status.message}</div>}
        </form>
      </section>
    </AdminWall>
  );
}
