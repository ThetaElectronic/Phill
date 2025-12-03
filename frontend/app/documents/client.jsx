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

const sorters = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "name", label: "Name" },
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
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="card surface stack" style={{ gap: "0.5rem" }}>
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
      <div className="stack" style={{ gap: "0.25rem" }}>
        {doc.text ? (
          <>
            <p className="tiny muted" style={{ margin: 0 }}>
              {expanded ? "Stored training text" : "Excerpt"}
            </p>
            <div
              className="tiny muted card"
              style={{
                whiteSpace: "pre-wrap",
                margin: 0,
                maxHeight: expanded ? "24rem" : "6rem",
                overflow: "auto",
              }}
            >
              {expanded ? doc.text : doc.excerpt || doc.text.slice(0, 300)}
            </div>
            <div className="chip-row" style={{ justifyContent: "flex-end" }}>
              <button type="button" className="ghost" onClick={() => setExpanded((prev) => !prev)}>
                {expanded ? "Hide text" : "View full text"}
              </button>
            </div>
          </>
        ) : doc.excerpt ? (
          <p className="tiny muted" style={{ margin: 0 }}>
            {doc.excerpt}
          </p>
        ) : (
          <p className="tiny muted" style={{ margin: 0 }}>
            No preview available.
          </p>
        )}
      </div>
    </div>
  );
}

export default function DocumentsClient({ session }) {
  const [tokens] = useState(() => session || loadTokens());
  const [documents, setDocuments] = useState([]);
  const [state, setState] = useState({ status: "idle" });
  const [filter, setFilter] = useState("all");
  const [lastLoaded, setLastLoaded] = useState(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");

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
      if (sort === "oldest") return new Date(a.created_at) - new Date(b.created_at);
      if (sort === "name") return a.filename.localeCompare(b.filename);
      return new Date(b.created_at) - new Date(a.created_at);
    });
    return sorted;
  }, [filteredDocs, sort]);

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
          setLastLoaded(new Date());
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

  const handleRefresh = async () => {
    if (!tokens) return;
    setState({ status: "loading" });
    try {
      const res = await fetchWithAuth("/ai/documents", { headers: { Accept: "application/json" } });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        const message = payload?.detail || `Request failed (${res.status})`;
        setState({ status: "error", message });
        return;
      }
      const data = await res.json();
      setDocuments(Array.isArray(data) ? data : []);
      setState({ status: "success" });
      setLastLoaded(new Date());
    } catch (error) {
      setState({ status: "error", message: error instanceof Error ? error.message : "Unable to load documents" });
    }
  };

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
                {lastLoaded && (
                  <span className="tiny muted" aria-live="polite">
                    Updated {lastLoaded.toLocaleTimeString()}
                  </span>
                )}
                <span className="muted tiny">{documents.length ? `${documents.length} total` : "No documents"}</span>
                <button type="button" className="secondary" onClick={handleRefresh} disabled={state.status === "loading"}>
                  Refresh
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
              <label className="tiny muted" htmlFor="document-search">
                Search by file name, scope, or excerpt
              </label>
              <input
                id="document-search"
                type="search"
                placeholder="Search documents"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          </div>

          {state.status === "loading" && <div className="status-info">Loading documents…</div>}
          {state.status === "error" && <div className="status-error">{state.message || "Unable to load documents"}</div>}

          {state.status === "success" && visibleDocs.length === 0 && (
            <div className="status-info">No documents match this filter.</div>
          )}

          {state.status === "success" && visibleDocs.length > 0 && (
            <div className="stack" style={{ gap: "0.75rem" }}>
              {visibleDocs.map((doc) => (
                <DocumentCard key={doc.id} doc={doc} />
              ))}
            </div>
          )}
        </div>
      </section>
    </AuthWall>
  );
}
