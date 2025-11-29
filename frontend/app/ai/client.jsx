"use client";

import { useEffect, useMemo, useState } from "react";

import AuthWall from "../../components/AuthWall";
import { fetchWithAuth, apiUrl } from "../../lib/api";
import { loadTokens } from "../../lib/auth";

export default function AiClient({ session }) {
  const [tokens] = useState(() => session || loadTokens());
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState({ state: "idle" });
  const chatUrl = useMemo(() => apiUrl("/ai/chat"), []);
  const [useMemory, setUseMemory] = useState(false);
  const [meta, setMeta] = useState(null);

  useEffect(() => {
    setStatus((prev) => (prev.state === "idle" ? prev : prev));
  }, []);

  const sendMessage = async () => {
    if (!tokens) {
      setStatus({ state: "error", message: "Login first" });
      return;
    }
    if (!input.trim()) return;
    setStatus({ state: "loading" });
    setMeta(null);
    try {
      const res = await fetchWithAuth("/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: input, persist: useMemory }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        const message = payload?.detail || `Request failed (${res.status})`;
        setStatus({ state: "error", message });
        return;
      }
      const data = await res.json();
      const reply = typeof data?.reply === "string" ? data.reply : "";

      setMessages((prev) => [
        ...prev,
        { role: "user", content: input },
        { role: "assistant", content: reply || "No reply received" },
      ]);
      setMeta({ model: data?.model, usage: data?.usage });
      setInput("");
      setStatus({ state: "success" });
    } catch (error) {
      setStatus({ state: "error", message: error instanceof Error ? error.message : "Unable to chat" });
    }
  };

  return (
    <AuthWall session={tokens} title="AI chat is protected" description="Sign in to use Phill AI with tenant-scoped memory.">
      <section className="grid" style={{ gap: "1.5rem" }}>
        <div className="stack">
          <div className="badge-list">
            <span className="pill">AI</span>
            <span className="pill pill-outline">Chat</span>
            <span className="pill pill-success">Memory optional</span>
          </div>
          <h1 style={{ margin: 0 }}>Phill AI</h1>
          <p className="muted" style={{ margin: 0 }}>
            Calls <code>{chatUrl}</code> with your bearer token. Toggle memory to persist company-scoped chat history.
          </p>
        </div>

        <div className="card stack" style={{ gap: "1rem" }}>
          <div className="grid two-col" style={{ gap: "0.75rem", alignItems: "end" }}>
            <label className="stack" style={{ gap: "0.35rem" }}>
              <span>Prompt</span>
              <textarea
                name="prompt"
                placeholder="Ask Phill"
                value={input}
                onChange={(event) => setInput(event.target.value)}
              />
            </label>
            <div className="stack" style={{ gap: "0.5rem" }}>
              <label className="chip-row" style={{ gap: "0.35rem" }}>
                <input type="checkbox" checked={useMemory} onChange={(e) => setUseMemory(e.target.checked)} />
                <span className="tiny muted">Persist to company memory</span>
              </label>
              <button type="button" onClick={sendMessage} disabled={status.state === "loading"}>
                {status.state === "loading" ? "Sending…" : "Send"}
              </button>
              <div className="tiny muted">Bearer token required</div>
            </div>
          </div>

          {status.state === "error" && <div className="status-error">{status.message}</div>}
          {status.state === "success" && <div className="status-success">Message sent</div>}

          {meta && (
            <div className="tiny muted badge-list" style={{ gap: "0.35rem" }}>
              {meta.model && <span className="pill pill-outline">{meta.model}</span>}
              {meta.usage?.total_tokens && <span className="pill">{meta.usage.total_tokens} tokens</span>}
            </div>
          )}

          {messages.length > 0 && (
            <div className="stack" style={{ gap: "0.5rem" }}>
              {messages.map((msg, idx) => (
                <div key={`${msg.role}-${idx}`} className="card surface">
                  <div className="badge-list" style={{ marginBottom: "0.25rem" }}>
                    <span className="pill">{msg.role}</span>
                  </div>
                  <div className="tiny" style={{ whiteSpace: "pre-wrap" }}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </AuthWall>
  );
}
