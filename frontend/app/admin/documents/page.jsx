"use client";

import { useEffect, useMemo, useState } from "react";

import AdminWall from "../../../components/AdminWall";
import { fetchWithAuth } from "../../../lib/api";
import { formatDateTime, formatRelative, formatTime, safeDate } from "../../../lib/dates";

const filters = [
  { value: "all", label: "All" },
  { value: "company", label: "Company" },
  { value: "global", label: "Global" },
];

const sorters = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "name", label: "Name" },
];

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "?";
  const thresholds = [
    { unit: "GB", value: 1024 * 1024 * 1024 },
    { unit: "MB", value: 1024 * 1024 },
    { unit: "KB", value: 1024 },
  ];
  for (const threshold of thresholds) {
    if (bytes >= threshold.value) {
      return `${(bytes / threshold.value).toFixed(1)} ${threshold.unit}`;
    }
  }
  return `${bytes} B`;
}

function ScopeBadge({ scope }) {
  if (scope === "global") return <span className="pill pill-success">Global training</span>;
  return <span className="pill pill-outline">Company scoped</span>;
}

function SkeletonCard() {
  return (
    <div className="card surface stack" style={{ gap: "0.35rem" }}>
      <div className="pill pill-soft" style={{ width: "30%", height: "0.9rem" }} />
      <div className="pill" style={{ width: "55%", height: "0.9rem" }} />
      <div className="pill pill-outline" style={{ width: "40%", height: "0.9rem" }} />
    </div>
  );
}

function DocumentCard({ doc, onDelete, onScopeChange, busy }) {
  const created = useMemo(() => safeDate(doc?.created_at), [doc.created_at]);
  const [expanded, setExpanded] = useState(false);
  const [copyState, setCopyState] = useState("idle");

  const handleCopy = async (text) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 1600);
    } catch (error) {
      console.error("Copy failed", error);
      setCopyState("error");
      setTimeout(() => setCopyState("idle"), 1600);
    }
  };

  return (
    <div className="card surface stack" style={{ gap: "0.5rem" }}>
      <div className="chip-row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <div className="badge-list" style={{ gap: "0.35rem" }}>
          <span className="pill">AI</span>
          <span className="pill pill-soft">Document</span>
          <ScopeBadge scope={doc.scope} />
          <span className="pill pill-outline">{formatBytes(doc.size)}</span>
        </div>
        <button
          type="button"
          className="ghost"
          onClick={() => onDelete(doc)}
          disabled={busy}
          aria-label={`Delete ${doc.filename}`}
        >
          Remove
        </button>
      </div>
      <div className="stack" style={{ gap: "0.15rem" }}>
        <strong>{doc.filename}</strong>
        <div className="tiny muted" style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
          <span>Uploaded {formatDateTime(created)}</span>
          <span>Type: {doc.content_type || "unknown"}</span>
        </div>
        {doc.text ? (
          <div className="stack" style={{ gap: "0.15rem" }}>
            <span className="tiny muted">{expanded ? "Stored text" : "Excerpt"}</span>
            <div
              className="tiny muted card"
              style={{
                whiteSpace: "pre-wrap",
                maxHeight: expanded ? "20rem" : "5.5rem",
                overflow: "auto",
                margin: 0,
              }}
            >
              {expanded ? doc.text : doc.excerpt || doc.text.slice(0, 300)}
            </div>
            <div className="chip-row" style={{ justifyContent: "flex-end" }}>
              <button type="button" className="ghost" onClick={() => handleCopy(doc.text || doc.excerpt)}>
                {copyState === "copied" ? "Copied" : copyState === "error" ? "Copy failed" : "Copy text"}
              </button>
              <button type="button" className="ghost" onClick={() => setExpanded((prev) => !prev)}>
                {expanded ? "Hide text" : "View full text"}
              </button>
            </div>
          </div>
        ) : (
          doc.excerpt && <p className="tiny muted">Excerpt: {doc.excerpt}</p>
        )}
      </div>
      <div className="chip-row" style={{ gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
        <label className="stack" style={{ gap: "0.15rem" }}>
          <span className="tiny muted">Training scope</span>
          <select
            value={doc.scope}
            disabled={busy}
            onChange={(event) => onScopeChange(doc, event.target.value)}
          >
            <option value="company">Company (default)</option>
            <option value="global">Global (shared)</option>
          </select>
        </label>
      </div>
    </div>
  );
}

export default function AdminDocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ state: "idle", message: "" });
  const [filter, setFilter] = useState(() => {
    if (typeof window === "undefined") return "all";
    try {
      const saved = JSON.parse(localStorage.getItem("phill-admin-doc-prefs") || "{}");
      return filters.some((item) => item.value === saved.filter) ? saved.filter : "all";
    } catch (error) {
      console.warn("Unable to read admin doc filter preference", error);
      return "all";
    }
  });
  const [query, setQuery] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      const saved = JSON.parse(localStorage.getItem("phill-admin-doc-prefs") || "{}");
      return typeof saved.query === "string" ? saved.query : "";
    } catch (error) {
      console.warn("Unable to read admin doc search preference", error);
      return "";
    }
  });
  const [sort, setSort] = useState(() => {
    if (typeof window === "undefined") return "newest";
    try {
      const saved = JSON.parse(localStorage.getItem("phill-admin-doc-prefs") || "{}");
      return sorters.some((item) => item.value === saved.sort) ? saved.sort : "newest";
    } catch (error) {
      console.warn("Unable to read admin doc sort preference", error);
      return "newest";
    }
  });
  const [lastLoaded, setLastLoaded] = useState(null);

  const filteredDocs = useMemo(() => {
    const scoped = filter === "all" ? documents : documents.filter((doc) => doc.scope === filter);
    if (!query.trim()) return scoped;
    const term = query.trim().toLowerCase();
    return scoped.filter((doc) => {
      const haystacks = [doc.filename, doc.excerpt, doc.text, doc.scope, doc.created_at];
      return haystacks.some((value) => (value ? String(value).toLowerCase().includes(term) : false));
    });
  }, [documents, filter, query]);

  const visibleDocs = useMemo(() => {
    const sorted = [...filteredDocs];
    sorted.sort((a, b) => {
      if (sort === "name") return a.filename.localeCompare(b.filename);
      const aDate = safeDate(a.created_at)?.getTime() || 0;
      const bDate = safeDate(b.created_at)?.getTime() || 0;
      if (sort === "oldest") return aDate - bDate;
      return bDate - aDate;
    });
    return sorted;
  }, [filteredDocs, sort]);

  useEffect(() => {
    try {
      localStorage.setItem(
        "phill-admin-doc-prefs",
        JSON.stringify({ filter, query, sort })
      );
    } catch (error) {
      console.warn("Unable to persist admin doc preferences", error);
    }
  }, [filter, query, sort]);

  const loadDocuments = async () => {
    setLoading(true);
    setStatus({ state: "idle", message: "" });
    try {
      const res = await fetchWithAuth("/api/ai/documents", { headers: { Accept: "application/json" } });
      if (!res.ok) {
        const detail = await res.text();
        setStatus({ state: "error", message: detail || "Unable to load documents" });
        return;
      }
      const payload = await res.json();
      setDocuments(Array.isArray(payload) ? payload : []);
      setLastLoaded(new Date());
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load documents";
      setStatus({ state: "error", message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleDelete = async (doc) => {
    setStatus({ state: "loading", message: `Removing ${doc.filename || "document"}` });
    try {
      const res = await fetchWithAuth(`/api/ai/documents/${doc.id}`, { method: "DELETE" });
      if (!res.ok) {
        const detail = await res.text();
        setStatus({ state: "error", message: detail || "Delete failed" });
        return;
      }
      setDocuments((prev) => prev.filter((item) => item.id !== doc.id));
      setLastLoaded(new Date());
      setStatus({ state: "success", message: `${doc.filename || "Document"} removed` });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to delete";
      setStatus({ state: "error", message });
    }
  };

  const handleScopeChange = async (doc, scope) => {
    if (!scope || scope === doc.scope) return;
    setStatus({ state: "loading", message: `Updating ${doc.filename || "document"}` });
    try {
      const res = await fetchWithAuth(`/api/ai/documents/${doc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail = payload?.detail || `Update failed (${res.status})`;
        setStatus({ state: "error", message: detail });
        return;
      }
      setDocuments((prev) => prev.map((item) => (item.id === doc.id ? payload : item)));
      setLastLoaded(new Date());
      setStatus({ state: "success", message: `${doc.filename || "Document"} scope updated` });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update";
      setStatus({ state: "error", message });
    }
  };

  return (
    <AdminWall title="Admin AI documents" description="Review and adjust AI training uploads for your company.">
      <section className="stack" style={{ gap: "1rem" }}>
        <div className="stack" style={{ gap: "0.35rem" }}>
          <div className="badge-list">
            <span className="pill">Admin</span>
            <span className="pill pill-outline">AI</span>
            <span className="pill pill-soft">Documents</span>
          </div>
          <h1 style={{ margin: 0 }}>Training documents</h1>
          <p className="muted" style={{ margin: 0 }}>
            View company and global AI uploads, adjust their scope, or remove outdated files without leaving the admin panel.
          </p>
        </div>

        <div className="card glass stack" style={{ gap: "0.75rem" }}>
          <div className="stack" style={{ gap: "0.65rem" }}>
            <div className="chip-row" style={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
              <div className="chip-row" role="radiogroup" aria-label="Filter documents by scope">
                {filters.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    className={`chip${filter === item.value ? " chip-active" : ""}`}
                    onClick={() => setFilter(item.value)}
                    role="radio"
                    aria-checked={filter === item.value}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="chip-row" style={{ alignItems: "center", gap: "0.35rem" }}>
                <div className="chip-row" role="radiogroup" aria-label="Sort documents">
                  {sorters.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      className={`chip chip-soft${sort === item.value ? " chip-active" : ""}`}
                      onClick={() => setSort(item.value)}
                      role="radio"
                      aria-checked={sort === item.value}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <span
                  className="tiny muted"
                  aria-live="polite"
                  title={formatDateTime(lastLoaded, "Not yet loaded")}
                >
                  Updated {formatRelative(lastLoaded, "Not yet loaded")}
                </span>
                <span className="muted tiny">
                  {visibleDocs.length
                    ? `${visibleDocs.length} shown${documents.length !== visibleDocs.length ? ` of ${documents.length}` : ""}`
                    : documents.length
                      ? "No documents match"
                      : "No documents yet"}
                </span>
                <button
                  type="button"
                  className="secondary"
                  onClick={loadDocuments}
                  disabled={loading || status.state === "loading"}
                >
                  {loading ? "Refreshing…" : "Refresh"}
                </button>
                <button
                  type="button"
                  className="ghost"
                  onClick={() => {
                    setFilter("all");
                    setQuery("");
                    setSort("newest");
                  }}
                >
                  Reset filters
                </button>
              </div>
            </div>
            <div className="stack" style={{ gap: "0.35rem" }}>
              <label className="tiny muted" htmlFor="admin-doc-search">
                Search by file name, scope, or stored text
              </label>
              <input
                id="admin-doc-search"
                type="search"
                placeholder="Search documents"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          </div>

          {status.state === "error" && <div className="status-error">{status.message}</div>}
          {status.state === "success" && <div className="status-success">{status.message}</div>}
          {status.state === "loading" && <div className="status-info">{status.message || "Working…"}</div>}

          {loading && (
            <div className="stack" style={{ gap: "0.5rem" }}>
              <div className="status-info">Loading documents…</div>
              <SkeletonCard />
              <SkeletonCard />
            </div>
          )}

          {!loading && visibleDocs.length === 0 && (
            <div className="status-info">
              {documents.length === 0 ? "No AI documents have been uploaded yet." : "No documents match these filters."}
            </div>
          )}

          {!loading &&
            visibleDocs.map((doc) => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                busy={status.state === "loading"}
                onDelete={handleDelete}
                onScopeChange={handleScopeChange}
              />
            ))}
        </div>
      </section>
    </AdminWall>
  );
}
