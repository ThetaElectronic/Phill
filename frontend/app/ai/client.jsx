"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import AuthWall from "../../components/AuthWall";
import { fetchWithAuth, apiUrl } from "../../lib/api";
import { loadTokens } from "../../lib/auth";

export default function AiClient({ session }) {
  const maxDocuments = Number(process.env.NEXT_PUBLIC_AI_MAX_DOCUMENTS || 5);
  const [tokens] = useState(() => session || loadTokens());
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState({ state: "idle" });
  const chatUrl = useMemo(() => apiUrl("/ai/chat"), []);
  const [aiStatus, setAiStatus] = useState({ ok: true });
  const [useMemory, setUseMemory] = useState(false);
  const [meta, setMeta] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [uploadStatus, setUploadStatus] = useState({ state: "idle" });
  const [docStatus, setDocStatus] = useState({ state: "idle" });
  const fileInputRef = useRef(null);

  useEffect(() => {
    setStatus((prev) => (prev.state === "idle" ? prev : prev));
  }, []);

  useEffect(() => {
    const loadAiStatus = async () => {
      try {
        const res = await fetch(apiUrl("/ai/status"));
        if (!res.ok) return;
        const data = await res.json();
        if (data && typeof data === "object") setAiStatus(data);
      } catch (error) {
        console.error("Unable to load AI status", error);
      }
    };

    loadAiStatus();

    const loadDocuments = async () => {
      if (!tokens) return;
      try {
        const res = await fetchWithAuth("/ai/documents", { headers: { Accept: "application/json" } });
        if (!res.ok) return;
        const data = await res.json();
        setDocuments(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Unable to load documents", error);
      }
    };

    loadDocuments();
  }, [tokens]);

  const sendMessage = async () => {
    if (!tokens) {
      setStatus({ state: "error", message: "Login first" });
      return;
    }
    if (aiStatus && aiStatus.ok === false) {
      setStatus({ state: "error", message: aiStatus?.detail || "AI is not configured" });
      return;
    }
    if (!input.trim()) return;
    setStatus({ state: "loading" });
    setMeta(null);
    try {
      const res = await fetchWithAuth("/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: input, persist: useMemory, document_ids: selectedDocs }),
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
      setSelectedDocs([]);
      setStatus({ state: "success" });
    } catch (error) {
      setStatus({ state: "error", message: error instanceof Error ? error.message : "Unable to chat" });
    }
  };

  const uploadDocument = async (file) => {
    if (!file || !tokens) return;
    if (aiStatus && aiStatus.ok === false) {
      setUploadStatus({ state: "error", message: aiStatus?.detail || "AI is not configured" });
      return;
    }
    setUploadStatus({ state: "loading", message: `Uploading ${file.name}` });
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetchWithAuth(
        "/ai/documents",
        {
          method: "POST",
          body: formData,
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = data?.detail || `Upload failed (${res.status})`;
        setUploadStatus({ state: "error", message });
        return;
      }
      setDocuments((prev) => [data, ...prev]);
      setUploadStatus({ state: "success", message: `${file.name} added` });
    } catch (error) {
      setUploadStatus({ state: "error", message: error instanceof Error ? error.message : "Upload failed" });
    }
  };

  const toggleDocument = (id) => {
    setDocStatus((prev) => (prev.state === "error" || prev.state === "success" ? { state: "idle" } : prev));
    setSelectedDocs((prev) => {
      if (prev.includes(id)) return prev.filter((docId) => docId !== id);

      if (prev.length >= maxDocuments) {
        setDocStatus({ state: "error", message: `Attach up to ${maxDocuments} documents per request.` });
        return prev;
      }

      return [...prev, id];
    });
  };

  const removeDocument = async (doc) => {
    if (!doc?.id) return;
    setDocStatus({ state: "loading", message: `Removing ${doc.filename || "document"}` });
    try {
      const res = await fetchWithAuth(`/ai/documents/${doc.id}`, { method: "DELETE" });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        const message = payload?.detail || `Delete failed (${res.status})`;
        setDocStatus({ state: "error", message });
        return;
      }
      setDocuments((prev) => prev.filter((item) => item.id !== doc.id));
      setSelectedDocs((prev) => prev.filter((item) => item !== doc.id));
      setDocStatus({ state: "success", message: `${doc.filename || "Document"} removed` });
    } catch (error) {
      setDocStatus({ state: "error", message: error instanceof Error ? error.message : "Unable to delete" });
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
          {aiStatus?.ok === false && (
            <div className="status-error" style={{ maxWidth: "720px" }}>
              AI is not ready: {aiStatus?.detail || "missing configuration"}
            </div>
          )}
        </div>

        <div className="card stack" style={{ gap: "1rem" }}>
          <div className="grid two-col" style={{ gap: "0.75rem" }}>
            <div className="stack" style={{ gap: "0.35rem" }}>
              <div className="stack" style={{ gap: "0.25rem" }}>
                <span>Upload a document (PDF or text)</span>
                <div className="chip-row" style={{ gap: "0.5rem", alignItems: "center" }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,text/plain,.txt,.md,.markdown"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) uploadDocument(file);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    style={{ display: "none" }}
                    disabled={aiStatus?.ok === false}
                  />
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={aiStatus?.ok === false}
                  >
                    Choose file
                  </button>
                  <span className="tiny muted">Max size enforced by server</span>
                </div>
              </div>
              {uploadStatus.state === "loading" && <div className="tiny muted">{uploadStatus.message}</div>}
              {uploadStatus.state === "error" && <div className="status-error">{uploadStatus.message}</div>}
              {uploadStatus.state === "success" && <div className="status-success">{uploadStatus.message}</div>}
            </div>

            <div className="stack" style={{ gap: "0.35rem" }}>
              <span className="tiny muted">Attach documents to ground the reply (up to {maxDocuments})</span>
              <div className="stack" style={{ gap: "0.35rem", maxHeight: "180px", overflow: "auto" }}>
                {documents.length === 0 && <div className="muted tiny">No documents uploaded yet</div>}
                {documents.map((doc) => (
                  <div key={doc.id} className="stack surface" style={{ gap: "0.4rem", padding: "0.5rem" }}>
                    <label className="chip-row" style={{ gap: "0.4rem", alignItems: "start" }}>
                      <input
                        type="checkbox"
                        checked={selectedDocs.includes(doc.id)}
                        onChange={() => toggleDocument(doc.id)}
                      />
                      <div className="stack" style={{ gap: "0.15rem" }}>
                        <span className="tiny" style={{ fontWeight: 600 }}>
                          {doc.filename || "Document"}
                        </span>
                        <span className="tiny muted">
                          {doc.size ? `${Math.round(doc.size / 1024)} KB` : ""}
                          {doc.size ? " • " : ""}
                          {doc.excerpt || "No preview"}
                        </span>
                      </div>
                    </label>
                    <div className="chip-row" style={{ justifyContent: "space-between", gap: "0.35rem" }}>
                      <span className="tiny muted">Uploaded {new Date(doc.created_at).toLocaleString()}</span>
                      <button type="button" className="secondary" onClick={() => removeDocument(doc)}>
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {docStatus.state === "error" && <div className="status-error">{docStatus.message}</div>}
              {docStatus.state === "success" && <div className="status-success">{docStatus.message}</div>}
            </div>
          </div>

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
              <button type="button" onClick={sendMessage} disabled={status.state === "loading" || aiStatus?.ok === false}>
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
