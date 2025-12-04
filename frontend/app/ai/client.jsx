"use client";

import { useEffect, useRef, useState } from "react";

import AuthWall from "../../components/AuthWall";
import { fetchWithAuth, apiUrl } from "../../lib/api";
import { loadTokens } from "../../lib/auth";
import { formatDateTime, formatRelative, formatTime, safeDate } from "../../lib/dates";

function DocumentSkeleton() {
  return (
    <div className="stack surface" style={{ gap: "0.45rem", padding: "0.5rem" }}>
      <div className="skeleton" style={{ width: "62%", height: "1rem" }} />
      <div className="skeleton" style={{ width: "38%", height: "0.9rem" }} />
      <div className="skeleton" style={{ width: "100%", height: "3.25rem" }} />
    </div>
  );
}

export default function AiClient({ session }) {
  const [tokens] = useState(() => session || loadTokens());
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState({ state: "idle" });
  const [aiStatus, setAiStatus] = useState(null);
  const [aiStatusState, setAiStatusState] = useState("loading");
  const [useMemory, setUseMemory] = useState(false);
  const [meta, setMeta] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [docStatus, setDocStatus] = useState({ state: "idle" });
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [documentsLoadedAt, setDocumentsLoadedAt] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [uploadScope, setUploadScope] = useState("company");
  const fileInputRef = useRef(null);
  const messageListRef = useRef(null);
  const [copiedMessage, setCopiedMessage] = useState(null);

  useEffect(() => {
    if (!messageListRef.current) return;
    const last = messageListRef.current.lastElementChild;
    if (last) last.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!Array.isArray(documents) || documents.length === 0) return;
    setSelectedDocs((prev) => prev.filter((id) => documents.some((doc) => doc.id === id)));
  }, [documents]);

  useEffect(() => {
    loadAiStatus();
    loadDocuments();
  }, [tokens]);

  const loadAiStatus = async () => {
    setAiStatusState("loading");
    try {
      const res = await fetch(apiUrl("/ai/status"));
      if (!res.ok) {
        const detail = await res.text();
        setAiStatus({ ok: false, detail: detail || "Unable to load AI status" });
        setAiStatusState("error");
        return;
      }
      const data = await res.json();
      if (data && typeof data === "object") setAiStatus(data);
      setAiStatusState("idle");
    } catch (error) {
      console.error("Unable to load AI status", error);
      setAiStatus({ ok: false, detail: "Unable to reach AI status" });
      setAiStatusState("error");
    }
  };

  const loadDocuments = async () => {
    if (!tokens) return;
    setDocumentsLoading(true);
    setDocStatus((prev) => {
      if (prev.state === "loading" || prev.state === "success") return prev;
      return { state: "idle" };
    });
    try {
      const res = await fetchWithAuth("/ai/documents", { headers: { Accept: "application/json" } });
      if (!res.ok) {
        const detail = await res.text();
        setDocStatus({ state: "error", message: detail || "Unable to load documents" });
        return;
      }
      const data = await res.json();
      setDocuments(Array.isArray(data) ? data : []);
      setDocumentsLoadedAt(new Date());
      setDocStatus({ state: "idle" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load documents";
      setDocStatus({ state: "error", message });
    } finally {
      setDocumentsLoading(false);
    }
  };

  const uploadDocuments = async (files) => {
    if (!tokens || !files?.length) return;
    setDocStatus({ state: "loading", message: `Uploading ${files.length} file${files.length === 1 ? "" : "s"}…` });
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      formData.append("scope", uploadScope);

      const res = await fetchWithAuth("/ai/documents", { method: "POST", body: formData });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        const message = payload?.detail || `Upload failed (${res.status})`;
        setDocStatus({ state: "error", message });
        return;
      }

      setDocStatus({ state: "success", message: `Uploaded ${files.length} file${files.length === 1 ? "" : "s"}` });
      await loadDocuments();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to upload documents";
      setDocStatus({ state: "error", message });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const sendMessage = async () => {
    if (status.state === "loading") return;
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

  const resetConversation = () => {
    setMessages([]);
    setMeta(null);
    setInput("");
    setStatus({ state: "idle" });
    setCopiedMessage(null);
  };

  const copyMessage = async (content, key) => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessage(key);
      setTimeout(() => setCopiedMessage(null), 2000);
    } catch (error) {
      console.error("Copy failed", error);
      setCopiedMessage("error");
    }
  };

  const toggleDocument = (id) => {
    setDocStatus((prev) => (prev.state === "error" || prev.state === "success" ? { state: "idle" } : prev));
    setSelectedDocs((prev) => {
      if (prev.includes(id)) return prev.filter((docId) => docId !== id);
      return [...prev, id];
    });
  };

  const clearSelectedDocs = () => {
    setSelectedDocs([]);
    setDocStatus((prev) => (prev.state === "error" ? { state: "idle" } : prev));
  };

  const openFilePicker = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = (event) => {
    const picked = Array.from(event.target.files || []);
    if (!picked.length) return;
    uploadDocuments(picked);
  };

  const aiReady = aiStatus?.ok === true;
  const aiTone =
    aiStatusState === "loading" ? "idle" : aiReady ? "ok" : aiStatus ? "error" : "idle";
  const aiLabel =
    aiStatusState === "loading"
      ? "Checking"
      : aiReady
        ? "Ready"
        : aiStatus
          ? "Needs setup"
          : "Checking";
  const aiCheckedLabel = formatRelative(aiStatus?.checked_at, "Not yet checked");
  const filteredDocs = Array.isArray(documents)
    ? documents
        .filter((doc) => {
          if (!searchTerm.trim()) return true;
          const haystack = `${doc.filename || ""} ${doc.excerpt || ""} ${doc.scope || ""} ${doc.created_at || ""}`.toLowerCase();
          return haystack.includes(searchTerm.toLowerCase());
        })
        .sort((a, b) => {
          const aDate = safeDate(a.created_at)?.getTime() || 0;
          const bDate = safeDate(b.created_at)?.getTime() || 0;
          return bDate - aDate;
        })
    : [];

  const lastLoadedLabel = formatTime(documentsLoadedAt, "Not yet loaded");

  return (
    <AuthWall session={tokens} title="AI chat is protected" description="Sign in to use Phill AI with tenant-scoped memory.">
      <section className="stack" style={{ gap: "1.25rem" }}>
        <div className="card glass stack" style={{ gap: "0.35rem" }}>
          <div className="badge-list">
            <span className="pill">Phill AI</span>
            <span className={`status-chip ${aiTone}`}>{aiLabel}</span>
            {aiStatus?.model && <span className="pill pill-outline">{aiStatus.model}</span>}
          </div>
          <div className="stack" style={{ gap: "0.15rem" }}>
            <h1 style={{ margin: 0 }}>Chat with Phill</h1>
            <p className="muted" style={{ margin: 0 }}>
              Focus on the conversation. Attach any training files you need from the Documents page and keep replies tidy.
            </p>
          </div>
          <div className="chip-row" style={{ gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              className="ghost"
              onClick={loadAiStatus}
              disabled={aiStatusState === "loading"}
            >
              {aiStatusState === "loading" ? "Checking…" : "Refresh status"}
            </button>
            <span className="tiny muted">Last check {aiCheckedLabel}</span>
          </div>
          {aiStatus?.ok === false && (
            <div className="status-error">
              {aiStatus?.detail || "AI is not ready yet. Add your OpenAI key and model in the environment."}
            </div>
          )}
        </div>

        <div className="card surface stack" style={{ gap: "0.75rem" }}>
          <header className="chip-row" style={{ gap: "0.5rem", alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" }}>
            <div className="stack" style={{ gap: "0.2rem" }}>
              <div className="badge-list">
                <span className="pill">Attachments</span>
                <span className="pill pill-outline">Training files</span>
              </div>
              <p className="muted tiny" style={{ margin: 0 }}>
                Pick or upload multiple files to ground your next prompt. Adjust scope later in Documents if you need to.
              </p>
            </div>
            <div className="chip-row" style={{ gap: "0.35rem", alignItems: "center", flexWrap: "wrap" }}>
              <button
                type="button"
                className="ghost"
                onClick={loadDocuments}
                disabled={documentsLoading || docStatus.state === "loading"}
              >
                {documentsLoading ? "Refreshing…" : "Refresh"}
              </button>
              <a className="secondary" href="/documents">
                Go to documents
              </a>
              {lastLoadedLabel && <span className="tiny muted">Updated {lastLoadedLabel}</span>}
            </div>
          </header>

          <div className="chip-row" style={{ gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
            <div className="chip-row" role="radiogroup" aria-label="Select upload scope">
              {["company", "global"].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`chip chip-soft${uploadScope === value ? " chip-active" : ""}`}
                  onClick={() => setUploadScope(value)}
                  role="radio"
                  aria-checked={uploadScope === value}
                >
                  {value === "company" ? "Company" : "Global"}
                </button>
              ))}
            </div>
            <div className="chip-row" style={{ gap: "0.35rem", alignItems: "center", flexWrap: "wrap" }}>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="*/*"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
              <button
                type="button"
                className="secondary"
                onClick={openFilePicker}
                disabled={docStatus.state === "loading"}
              >
                {docStatus.state === "loading" ? "Uploading…" : "Upload files"}
              </button>
              <span className="tiny muted">Select multiple PDFs, images, slides, or spreadsheets at once.</span>
            </div>
          </div>

          <div className="chip-row" style={{ gap: "0.35rem", alignItems: "center", flexWrap: "wrap" }}>
            <input
              className="secondary"
              type="search"
              placeholder="Search training files"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              style={{ minWidth: "220px" }}
            />
            <span className="tiny muted">
              {selectedDocs.length === 0
                ? "No attachments selected"
                : `${selectedDocs.length} attachment${selectedDocs.length === 1 ? "" : "s"} ready for chat`}
            </span>
            <button
              type="button"
              className="ghost"
              onClick={clearSelectedDocs}
              disabled={selectedDocs.length === 0}
            >
              Clear attachments
            </button>
          </div>

          <div className="stack" style={{ gap: "0.35rem", maxHeight: "260px", overflow: "auto" }}>
            {documentsLoading && (
              <div className="stack" style={{ gap: "0.35rem" }}>
                {[...Array(3)].map((_, idx) => (
                  <DocumentSkeleton key={`doc-skel-${idx}`} />
                ))}
              </div>
            )}
            {!documentsLoading && filteredDocs.length === 0 && (
              <div className="muted tiny">
                {documents.length === 0 ? "No documents uploaded yet" : "No documents match this filter"}
              </div>
            )}
            {!documentsLoading &&
              filteredDocs.map((doc) => {
                const createdAt = formatDateTime(doc.created_at, "Timestamp pending");
                return (
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
                      <div className="chip-row" style={{ gap: "0.35rem", alignItems: "center", flexWrap: "wrap" }}>
                        <span className={doc.scope === "global" ? "pill pill-outline" : "pill"}>
                          {doc.scope === "global" ? "Global training" : "Company"}
                        </span>
                        {doc.size && <span className="tiny muted">{Math.round(doc.size / 1024)} KB</span>}
                        <span className="tiny muted">{createdAt}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
          {docStatus.state === "loading" && <div className="status-info">{docStatus.message || "Uploading…"}</div>}
          {docStatus.state === "success" && <div className="status-success">{docStatus.message || "Upload complete"}</div>}
          {docStatus.state === "error" && <div className="status-error">{docStatus.message}</div>}
        </div>

        <div className="card surface stack" style={{ gap: "0.75rem" }}>
          <header className="chip-row" style={{ justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
            <div className="stack" style={{ gap: "0.2rem" }}>
              <div className="badge-list">
                <span className="pill">Chat</span>
                <span className="pill pill-outline">Memory toggle</span>
              </div>
              <p className="muted tiny" style={{ margin: 0 }}>
                Craft a prompt, attach any uploaded documents, and decide if this exchange should shape your personal assistant memory.
              </p>
            </div>
            {messages.length > 0 && (
              <button type="button" className="ghost" onClick={resetConversation} disabled={status.state === "loading"}>
                Clear conversation
              </button>
            )}
          </header>
          <label className="stack" style={{ gap: "0.35rem" }}>
            <span>Prompt</span>
            <textarea
              name="prompt"
              placeholder="Ask Phill"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                  event.preventDefault();
                  sendMessage();
                }
              }}
            />
          </label>
          <div className="chip-row" style={{ justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
            <label className="chip-row" style={{ gap: "0.35rem", alignItems: "center" }}>
              <input type="checkbox" checked={useMemory} onChange={(e) => setUseMemory(e.target.checked)} />
              <span className="tiny muted">Save to my personal memory</span>
            </label>
            <div className="chip-row" style={{ gap: "0.35rem", alignItems: "center", flexWrap: "wrap" }}>
              {selectedDocs.length > 0 && (
                <span className="tiny muted">
                  {selectedDocs.length} document{selectedDocs.length === 1 ? "" : "s"} attached
                </span>
              )}
              <button
                type="button"
                onClick={sendMessage}
                disabled={status.state === "loading" || !aiReady || !input.trim()}
              >
                {status.state === "loading" ? "Sending…" : "Send"}
              </button>
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
            <div className="stack" style={{ gap: "0.5rem", maxHeight: "320px", overflow: "auto" }} ref={messageListRef}>
              {messages.map((msg, idx) => {
                const key = `${msg.role}-${idx}`;
                return (
                  <div key={key} className="card glass stack" style={{ gap: "0.35rem" }}>
                    <div className="chip-row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                      <div className="badge-list" style={{ marginBottom: "0.25rem" }}>
                        <span className="pill">{msg.role}</span>
                      </div>
                      <button
                        type="button"
                        className="ghost"
                        onClick={() => copyMessage(msg.content, key)}
                      >
                        {copiedMessage === key ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <div className="tiny" style={{ whiteSpace: "pre-wrap" }}>
                      {msg.content}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </AuthWall>
  );
}
