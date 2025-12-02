"use client";

import { useEffect, useRef, useState } from "react";

import AuthWall from "../../components/AuthWall";
import { fetchWithAuth, apiUrl } from "../../lib/api";
import { loadTokens } from "../../lib/auth";

export default function AiClient({ session }) {
  const [tokens] = useState(() => session || loadTokens());
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState({ state: "idle" });
  const [aiStatus, setAiStatus] = useState({ ok: true });
  const [useMemory, setUseMemory] = useState(false);
  const [meta, setMeta] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [uploadStatus, setUploadStatus] = useState({ state: "idle" });
  const [docStatus, setDocStatus] = useState({ state: "idle" });
  const [docScope, setDocScope] = useState("company");
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
        body: JSON.stringify({
          prompt: input,
          persist: useMemory,
          memory_scope: "personal",
          document_ids: selectedDocs,
        }),
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
    formData.append("scope", docScope);

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

  const updateScope = async (doc, scope) => {
    if (!doc?.id) return;
    setDocStatus({ state: "loading", message: `Updating ${doc.filename || "document"}` });
    try {
      const res = await fetchWithAuth(`/ai/documents/${doc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = payload?.detail || `Update failed (${res.status})`;
        setDocStatus({ state: "error", message });
        return;
      }

      setDocuments((prev) => prev.map((item) => (item.id === doc.id ? payload : item)));
      setDocStatus({ state: "success", message: `${doc.filename || "Document"} scope updated` });
    } catch (error) {
      setDocStatus({ state: "error", message: error instanceof Error ? error.message : "Unable to update" });
    }
  };

  const aiReady = aiStatus?.ok !== false;

  return (
    <AuthWall session={tokens} title="AI chat is protected" description="Sign in to use Phill AI with tenant-scoped memory.">
      <section className="stack" style={{ gap: "1.25rem" }}>
        <div className="card glass stack" style={{ gap: "0.35rem" }}>
          <div className="badge-list">
            <span className="pill">Phill AI</span>
            <span className="pill pill-outline">Workspace chat</span>
          </div>
          <div className="stack" style={{ gap: "0.15rem" }}>
            <h1 style={{ margin: 0 }}>Chat and training files</h1>
            <p className="muted" style={{ margin: 0 }}>
              Keep uploads tidy, choose scope, attach what you need, and save responses to your personal memory when helpful.
            </p>
          </div>
          {!aiReady && <div className="status-error">AI is not ready yet. Check credentials in diagnostics.</div>}
        </div>

        <div className="grid two-col" style={{ gap: "1rem" }}>
          <div className="card surface stack" style={{ gap: "0.75rem" }}>
            <header className="chip-row" style={{ gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
              <div className="badge-list" style={{ gap: "0.35rem" }}>
                <span className="pill">Training files</span>
                <span className="pill pill-outline">Upload</span>
              </div>
              <div className="chip-row" style={{ gap: "0.35rem", alignItems: "center" }}>
                <label className="chip-row" style={{ gap: "0.25rem", alignItems: "center" }}>
                  <input
                    type="radio"
                    name="doc-scope"
                    value="company"
                    checked={docScope === "company"}
                    onChange={(event) => setDocScope(event.target.value)}
                  />
                  <span className="tiny muted">Company</span>
                </label>
                <label className="chip-row" style={{ gap: "0.25rem", alignItems: "center" }}>
                  <input
                    type="radio"
                    name="doc-scope"
                    value="global"
                    checked={docScope === "global"}
                    onChange={(event) => setDocScope(event.target.value)}
                  />
                  <span className="tiny muted">Global</span>
                </label>
              </div>
            </header>
            <div className="chip-row" style={{ gap: "0.35rem", flexWrap: "wrap", alignItems: "center" }}>
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
                disabled={!aiReady}
              />
              <button
                type="button"
                className="secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={!aiReady}
              >
                Upload file
              </button>
              <span className="tiny muted">PDF or text — scope is set per upload.</span>
            </div>
            {uploadStatus.state === "loading" && <div className="tiny muted">{uploadStatus.message}</div>}
            {uploadStatus.state === "error" && <div className="status-error">{uploadStatus.message}</div>}
            {uploadStatus.state === "success" && <div className="status-success">{uploadStatus.message}</div>}

            <div className="stack" style={{ gap: "0.35rem", maxHeight: "220px", overflow: "auto" }}>
              {documents.length === 0 && <div className="muted tiny">No documents uploaded yet</div>}
              {documents.map((doc) => (
                <div key={doc.id} className="stack surface" style={{ gap: "0.35rem", padding: "0.5rem" }}>
                  <label className="chip-row" style={{ gap: "0.4rem", alignItems: "start" }}>
                    <input
                      type="checkbox"
                      checked={selectedDocs.includes(doc.id)}
                      onChange={() => toggleDocument(doc.id)}
                    />
                    <div className="stack" style={{ gap: "0.1rem" }}>
                      <strong className="tiny">{doc.filename || "Document"}</strong>
                      <span className="tiny muted">{doc.excerpt || "No preview"}</span>
                    </div>
                  </label>
                  <div className="chip-row" style={{ justifyContent: "space-between", gap: "0.35rem", flexWrap: "wrap" }}>
                    <div className="chip-row" style={{ gap: "0.35rem", alignItems: "center" }}>
                      <span className={doc.scope === "global" ? "pill pill-outline" : "pill"}>
                        {doc.scope === "global" ? "Global training" : "Company"}
                      </span>
                      {doc.size && <span className="tiny muted">{Math.round(doc.size / 1024)} KB</span>}
                    </div>
                    <div className="chip-row" style={{ gap: "0.35rem", flexWrap: "wrap" }}>
                      <select
                        value={doc.scope || "company"}
                        onChange={(event) => updateScope(doc, event.target.value)}
                        className="secondary"
                      >
                        <option value="company">Company</option>
                        <option value="global">Global</option>
                      </select>
                      <button type="button" className="secondary" onClick={() => removeDocument(doc)}>
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {docStatus.state === "error" && <div className="status-error">{docStatus.message}</div>}
            {docStatus.state === "success" && <div className="status-success">{docStatus.message}</div>}
          </div>

          <div className="card surface stack" style={{ gap: "0.75rem" }}>
            <div className="stack" style={{ gap: "0.2rem" }}>
              <div className="badge-list">
                <span className="pill">Chat</span>
                <span className="pill pill-outline">Memory toggle</span>
              </div>
              <p className="muted tiny" style={{ margin: 0 }}>
                Craft a prompt, attach any uploaded documents, and decide if this exchange should shape your personal
                assistant memory.
              </p>
            </div>
            <label className="stack" style={{ gap: "0.35rem" }}>
              <span>Prompt</span>
              <textarea
                name="prompt"
                placeholder="Ask Phill"
                value={input}
                onChange={(event) => setInput(event.target.value)}
              />
            </label>
            <div className="chip-row" style={{ justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
              <label className="chip-row" style={{ gap: "0.35rem", alignItems: "center" }}>
                <input type="checkbox" checked={useMemory} onChange={(e) => setUseMemory(e.target.checked)} />
                <span className="tiny muted">Save to my personal memory</span>
              </label>
              <button type="button" onClick={sendMessage} disabled={status.state === "loading" || !aiReady}>
                {status.state === "loading" ? "Sending…" : "Send"}
              </button>
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
                  <div key={`${msg.role}-${idx}`} className="card glass">
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
        </div>
      </section>
    </AuthWall>
  );
}
