"use client";

import { useEffect, useMemo, useState } from "react";

import AuthWall from "../../components/AuthWall";
import { bearerHeaders, loadTokens } from "../../lib/auth";
import { apiUrl } from "../../lib/api";

const initialForm = {
  prompt: "",
  system: "",
  remember: true,
};

export default function AIPage() {
  const [tokens, setTokens] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [history, setHistory] = useState([]);
  const [state, setState] = useState({ status: "idle" });

  const chatUrl = useMemo(() => apiUrl("/ai/chat"), []);

  useEffect(() => {
    setTokens(loadTokens());
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!tokens) {
      setState({ status: "error", message: "Please sign in first" });
      return;
    }
    if (!form.prompt.trim()) {
      setState({ status: "error", message: "Enter a prompt to chat" });
      return;
    }

    setState({ status: "loading" });
    try {
      const body = {
        prompt: form.prompt,
        system: form.system || undefined,
        company_id: form.remember ? undefined : null,
      };

      const res = await fetch(chatUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...bearerHeaders(tokens),
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        const message = payload?.detail || `Request failed (${res.status})`;
        setState({ status: "error", message });
        return;
      }

      const data = await res.json();
      setHistory((prev) => [
        { role: "user", content: form.prompt },
        { role: "assistant", content: JSON.stringify(data.output, null, 2) },
        ...prev,
      ]);
      setForm((prev) => ({ ...prev, prompt: "" }));
      setState({ status: "success", payload: data });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to reach AI";
      setState({ status: "error", message });
    }
  };

  const resetHistory = () => {
    setHistory([]);
    setState({ status: "idle" });
  };

  return (
    <AuthWall title="Phill AI requires login" description="Sign in to send prompts with your company scope and audit trail.">
      <section className="grid" style={{ gap: "1.5rem" }}>
      <div className="stack">
        <div className="badge-list">
          <span className="pill">Phill AI</span>
          <span className="pill pill-outline">GPT-5.1</span>
          <span className="pill pill-success">Guardrails</span>
        </div>
        <h1 style={{ margin: 0 }}>Chat assistant</h1>
        <p className="muted" style={{ margin: 0 }}>
          Live calls to <code>{chatUrl}</code> with safeguards and company-scoped memory. Authenticate first to
          include your bearer token.
        </p>
      </div>

      <div className="grid two-col" style={{ gap: "1rem" }}>
        <div className="card stack" style={{ gap: "1rem" }}>
          <h2>Ask Phill</h2>
          <form className="grid" style={{ gap: "0.75rem" }} onSubmit={handleSubmit}>
            <label>
              Prompt
              <textarea
                name="prompt"
                rows={4}
                required
                placeholder="Ask about incidents, policies, or procedures…"
                value={form.prompt}
                onChange={(event) => setForm((prev) => ({ ...prev, prompt: event.target.value }))}
              />
            </label>

            <label>
              Optional system prompt
              <textarea
                name="system"
                rows={2}
                placeholder="Leave blank to use the default safe system prompt"
                value={form.system}
                onChange={(event) => setForm((prev) => ({ ...prev, system: event.target.value }))}
              />
            </label>

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={form.remember}
                onChange={(event) => setForm((prev) => ({ ...prev, remember: event.target.checked }))}
              />
              <div className="stack" style={{ gap: "0.15rem" }}>
                <strong>Store memory for my company</strong>
                <span className="tiny muted">
                  When enabled, responses are stored via <code>AiMemory</code> for your company. Uncheck to skip
                  persistence.
                </span>
              </div>
            </label>

            <div className="grid two-col" style={{ gap: "0.5rem" }}>
              <button type="submit" disabled={state.status === "loading"}>
                {state.status === "loading" ? "Requesting…" : "Send"}
              </button>
              <button type="button" className="ghost" onClick={resetHistory}>
                Clear history
              </button>
            </div>
          </form>

          {!tokens && <div className="status-info">Sign in to include your bearer token.</div>}
          {state.status === "error" && <div className="status-error">{state.message}</div>}
          {state.status === "success" && (
            <div className="status-success tiny">Response received and memory handled per your choice.</div>
          )}
        </div>

        <div className="card stack" style={{ gap: "0.75rem" }}>
          <h2>Conversation</h2>
          {history.length === 0 && (
            <div className="muted tiny">No messages yet. Ask Phill to see guarded responses here.</div>
          )}
          {history.length > 0 && (
            <div className="grid" style={{ gap: "0.5rem" }}>
              {history.map((item, idx) => (
                <div key={idx} className="card surface stack" style={{ gap: "0.25rem" }}>
                  <div className="pill pill-outline" style={{ width: "fit-content" }}>{item.role}</div>
                  <pre className="code-block tiny" style={{ whiteSpace: "pre-wrap", margin: 0 }}>
{item.content}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      </section>
    </AuthWall>
  );
}
