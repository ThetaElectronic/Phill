"use client";

import { useEffect, useMemo, useState } from "react";

import AdminWall from "../../../components/AdminWall";
import { fetchWithAuth } from "../../../lib/api";

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
  const created = useMemo(() => new Date(doc.created_at), [doc.created_at]);
  const [expanded, setExpanded] = useState(false);

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
          <span>Uploaded {created.toLocaleDateString()} {created.toLocaleTimeString()}</span>
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
          <div className="chip-row" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <span className="muted tiny">
              {documents.length ? `${documents.length} document${documents.length === 1 ? "" : "s"}` : "No documents yet"}
            </span>
            <button type="button" className="secondary" onClick={loadDocuments} disabled={loading || status.state === "loading"}>
              {loading ? "Refreshing…" : "Refresh"}
            </button>
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

          {!loading && documents.length === 0 && (
            <div className="status-info">No AI documents have been uploaded yet.</div>
          )}

          {!loading &&
            documents.map((doc) => (
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
