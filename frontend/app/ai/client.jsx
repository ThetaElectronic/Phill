"use client";

import { useEffect, useRef, useState } from "react";

import AuthWall from "../../components/AuthWall";
import { fetchWithAuth, apiUrl } from "../../lib/api";
import { loadTokens } from "../../lib/auth";
import { formatDateTime, formatRelative, formatTime, safeDate } from "../../lib/dates";

const STORAGE_KEYS = {
  scope: "ai-doc-scope",
  filter: "ai-doc-filter",
  sort: "ai-doc-sort",
};

const allowedFilters = new Set(["all", "company", "global"]);
const allowedSort = new Set(["newest", "oldest", "name"]);
const allowedScopes = new Set(["company", "global"]);

const getStored = (key, fallback, allowed) => {
  if (typeof window === "undefined") return fallback;
  const value = localStorage.getItem(key);
  if (!value) return fallback;
  if (allowed && !allowed.has(value)) return fallback;
  return value;
};

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
  const [documentFilter, setDocumentFilter] = useState(() =>
    getStored(STORAGE_KEYS.filter, "all", allowedFilters),
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState(() => getStored(STORAGE_KEYS.sort, "newest", allowedSort));
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({ state: "idle" });
  const [docStatus, setDocStatus] = useState({ state: "idle" });
  const [docScope, setDocScope] = useState(() => getStored(STORAGE_KEYS.scope, "company", allowedScopes));
  const [documentsLoadedAt, setDocumentsLoadedAt] = useState(null);
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
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.scope, docScope);
  }, [docScope]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.filter, documentFilter);
  }, [documentFilter]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.sort, sortBy);
  }, [sortBy]);

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
    setDocStatus((prev) => (prev.state === "loading" ? prev : { state: "idle" }));
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

  const clearSelectedDocs = () => {
    setSelectedDocs([]);
    setDocStatus((prev) => (prev.state === "error" ? { state: "idle" } : prev));
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
        .filter((doc) =>
          documentFilter === "all"
            ? true
            : documentFilter === "company"
              ? doc.scope !== "global"
              : doc.scope === "global",
        )
        .filter((doc) => {
          if (!searchTerm.trim()) return true;
          const haystack = `${doc.filename || ""} ${doc.excerpt || ""} ${doc.scope || ""} ${doc.created_at || ""}`.toLowerCase();
          return haystack.includes(searchTerm.toLowerCase());
        })
        .sort((a, b) => {
          const newerFirst = sortBy === "newest";
          if (sortBy === "name") {
            return (a.filename || "").localeCompare(b.filename || "");
          }
          const aDate = safeDate(a.created_at)?.getTime() || 0;
          const bDate = safeDate(b.created_at)?.getTime() || 0;
          return newerFirst ? bDate - aDate : aDate - bDate;
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
            <h1 style={{ margin: 0 }}>Chat and training files</h1>
            <p className="muted" style={{ margin: 0 }}>
              Keep uploads tidy, choose scope, attach what you need, and save responses to your personal memory when helpful.
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

        <div className="grid two-col" style={{ gap: "1rem" }}>
          <div className="card surface stack" style={{ gap: "0.75rem" }}>
            <header className="chip-row" style={{ gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
              <div className="badge-list" style={{ gap: "0.35rem" }}>
                <span className="pill">Training files</span>
                <span className="pill pill-outline">Upload</span>
              </div>
              <div className="chip-row" style={{ gap: "0.35rem", alignItems: "center" }}>
                <button
                  type="button"
                  className="ghost"
                  onClick={loadDocuments}
                  disabled={documentsLoading || docStatus.state === "loading"}
                >
                  {documentsLoading ? "Refreshing…" : "Refresh"}
                </button>
                {lastLoadedLabel && <span className="tiny muted">Updated {lastLoadedLabel}</span>}
              </div>
            </header>
            <div className="chip-row" style={{ gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
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
                <select
                  className="secondary"
                  value={documentFilter}
                  onChange={(event) => setDocumentFilter(event.target.value)}
                >
                  <option value="all">All scopes</option>
                  <option value="company">Company</option>
                  <option value="global">Global</option>
                </select>
              </div>
              <input
                className="secondary"
                type="search"
                placeholder="Search documents"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                style={{ minWidth: "140px" }}
              />
              <select className="secondary" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="name">Name</option>
              </select>
              <button
                type="button"
                className="ghost"
                onClick={() => {
                  setDocumentFilter("all");
                  setSearchTerm("");
                  setSortBy("newest");
                }}
              >
                Reset
              </button>
              <span className="tiny muted">
                Showing {filteredDocs.length} of {documents.length} uploads
              </span>
            </div>
            <div className="chip-row" style={{ gap: "0.35rem", alignItems: "center", flexWrap: "wrap" }}>
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
              {documentsLoading && (
                <div className="stack" style={{ gap: "0.35rem" }}>
                  {[...Array(3)].map((_, idx) => (
                    <DocumentSkeleton key={`doc-skel-${idx}`} />
                  ))}
                </div>
              )}
              {!documentsLoading && filteredDocs.length === 0 && (
                <div className="muted tiny">{documents.length === 0 ? "No documents uploaded yet" : "No documents match this filter"}</div>
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
                  );
                })}
            </div>
            {docStatus.state === "error" && <div className="status-error">{docStatus.message}</div>}
            {docStatus.state === "success" && <div className="status-success">{docStatus.message}</div>}
          </div>

          <div className="card surface stack" style={{ gap: "0.75rem" }}>
            <header className="chip-row" style={{ justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
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
                  <span className="tiny muted">{selectedDocs.length} document{selectedDocs.length === 1 ? "" : "s"} attached</span>
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
        </div>
      </section>
    </AuthWall>
  );
}
