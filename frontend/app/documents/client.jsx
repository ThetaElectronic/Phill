"use client";

import { useEffect, useMemo, useState } from "react";

import AuthWall from "../../components/AuthWall";
import { fetchWithAuth } from "../../lib/api";
import { loadTokens } from "../../lib/auth";

const filters = [
  { value: "all", label: "All" },
  { value: "company", label: "Company" },
  { value: "global", label: "Global" },
];

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "?";
  const units = [
    { value: 1024 * 1024 * 1024, label: "GB" },
    { value: 1024 * 1024, label: "MB" },
    { value: 1024, label: "KB" },
  ];
  for (const unit of units) {
    if (bytes >= unit.value) return `${(bytes / unit.value).toFixed(1)} ${unit.label}`;
  }
  return `${bytes} B`;
}

function DocumentCard({ doc }) {
  const created = useMemo(() => new Date(doc.created_at), [doc.created_at]);
  return (
    <div className="card surface stack" style={{ gap: "0.35rem" }}>
      <div className="chip-row" style={{ alignItems: "center", justifyContent: "space-between" }}>
        <div className="badge-list" style={{ gap: "0.35rem" }}>
          <span className="pill">{doc.filename}</span>
          <span className="pill pill-outline">{formatBytes(doc.size)}</span>
          <span className={`pill ${doc.scope === "global" ? "pill-success" : "pill-soft"}`}>
            {doc.scope === "global" ? "Global training" : "Company"}
          </span>
        </div>
        <span className="tiny muted" style={{ whiteSpace: "nowrap" }}>
          {created.toLocaleDateString()} {created.toLocaleTimeString()}
        </span>
      </div>
      {doc.excerpt ? <p className="tiny muted">{doc.excerpt}</p> : <p className="tiny muted">No preview available.</p>}
    </div>
  );
}

export default function DocumentsClient({ session }) {
  const [tokens] = useState(() => session || loadTokens());
  const [documents, setDocuments] = useState([]);
  const [state, setState] = useState({ status: "idle" });
  const [filter, setFilter] = useState("all");

  const filteredDocs = useMemo(() => {
    if (filter === "all") return documents;
    return documents.filter((doc) => doc.scope === filter);
  }, [documents, filter]);

  useEffect(() => {
    if (!tokens) return;
    let cancelled = false;
    const fetchDocs = async () => {
      setState({ status: "loading" });
      try {
        const res = await fetchWithAuth("/ai/documents", { headers: { Accept: "application/json" } });
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          const message = payload?.detail || `Request failed (${res.status})`;
          if (!cancelled) setState({ status: "error", message });
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setDocuments(Array.isArray(data) ? data : []);
          setState({ status: "success" });
        }
      } catch (error) {
        if (!cancelled)
          setState({ status: "error", message: error instanceof Error ? error.message : "Unable to load documents" });
      }
    };
    fetchDocs();
    return () => {
      cancelled = true;
    };
  }, [tokens]);

  return (
    <AuthWall session={tokens} title="Training documents" description="Signed-in users can review uploaded AI files.">
      <section className="stack" style={{ gap: "1.25rem" }}>
        <div className="stack" style={{ gap: "0.35rem" }}>
          <div className="badge-list">
            <span className="pill">AI</span>
            <span className="pill pill-outline">Training</span>
            <span className="pill pill-soft">Documents</span>
          </div>
          <h1 style={{ margin: 0 }}>Documents</h1>
          <p className="muted" style={{ margin: 0 }}>
            These are the files you and your team uploaded to ground Phill. Upload and manage training files from the AI page;
            this view simply lists what is available.
          </p>
        </div>

        <div className="card glass stack" style={{ gap: "0.75rem" }}>
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
              <span className="muted tiny">{documents.length ? `${documents.length} total` : "No documents"}</span>
              <button type="button" className="secondary" onClick={() => setFilter("all")}>
                Reset filters
              </button>
            </div>
          </div>

          {state.status === "loading" && <div className="status-info">Loading documents…</div>}
          {state.status === "error" && <div className="status-error">{state.message || "Unable to load documents"}</div>}

          {state.status === "success" && filteredDocs.length === 0 && (
            <div className="status-info">No documents match this filter.</div>
          )}

          {state.status === "success" && filteredDocs.length > 0 && (
            <div className="stack" style={{ gap: "0.75rem" }}>
              {filteredDocs.map((doc) => (
                <DocumentCard key={doc.id} doc={doc} />
              ))}
            </div>
          )}
        </div>
      </section>
    </AuthWall>
  );
}
