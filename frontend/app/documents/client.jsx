"use client";

import { useEffect, useMemo, useState } from "react";

import AuthWall from "../../components/AuthWall";
import { fetchWithAuth } from "../../lib/api";
import { loadTokens } from "../../lib/auth";
import { formatDateTime, formatTime, safeDate } from "../../lib/dates";

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
      <div className="chip-row" style={{ alignItems: "center", justifyContent: "space-between" }}>
        <div className="badge-list" style={{ gap: "0.35rem" }}>
          <span className="pill">{doc.filename}</span>
          <span className="pill pill-outline">{formatBytes(doc.size)}</span>
          <span className={`pill ${doc.scope === "global" ? "pill-success" : "pill-soft"}`}>
            {doc.scope === "global" ? "Global training" : "Company"}
          </span>
        </div>
        <span className="tiny muted" style={{ whiteSpace: "nowrap" }}>
          {formatDateTime(created)}
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
              <button type="button" className="ghost" onClick={() => handleCopy(doc.text || doc.excerpt)}>
                {copyState === "copied" ? "Copied" : copyState === "error" ? "Copy failed" : "Copy text"}
              </button>
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

function DocumentSkeleton() {
  return (
    <div className="card surface stack" style={{ gap: "0.75rem" }}>
      <div className="chip-row" style={{ gap: "0.4rem", alignItems: "center", flexWrap: "wrap" }}>
        <div className="skeleton" style={{ width: "30%", height: "1rem" }} />
        <div className="skeleton" style={{ width: "12%", height: "0.9rem" }} />
        <div className="skeleton" style={{ width: "18%", height: "0.9rem" }} />
        <div className="skeleton" style={{ width: "22%", height: "0.9rem" }} />
      </div>
      <div className="skeleton" style={{ width: "55%", height: "0.9rem" }} />
      <div className="skeleton" style={{ width: "100%", height: "5rem" }} />
    </div>
  );
}

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
  const created = useMemo(() => (doc?.created_at ? new Date(doc.created_at) : null), [doc.created_at]);
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
      <div className="chip-row" style={{ alignItems: "center", justifyContent: "space-between" }}>
        <div className="badge-list" style={{ gap: "0.35rem" }}>
          <span className="pill">{doc.filename}</span>
          <span className="pill pill-outline">{formatBytes(doc.size)}</span>
          <span className={`pill ${doc.scope === "global" ? "pill-success" : "pill-soft"}`}>
            {doc.scope === "global" ? "Global training" : "Company"}
          </span>
        </div>
        <span className="tiny muted" style={{ whiteSpace: "nowrap" }}>
          {created ? `${created.toLocaleDateString()} ${created.toLocaleTimeString()}` : "Pending timestamp"}
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
              <button type="button" className="ghost" onClick={() => handleCopy(doc.text || doc.excerpt)}>
                {copyState === "copied" ? "Copied" : copyState === "error" ? "Copy failed" : "Copy text"}
              </button>
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

function DocumentSkeleton() {
  return (
    <div className="card surface stack" style={{ gap: "0.75rem" }}>
      <div className="chip-row" style={{ gap: "0.4rem", alignItems: "center", flexWrap: "wrap" }}>
        <div className="skeleton" style={{ width: "30%", height: "1rem" }} />
        <div className="skeleton" style={{ width: "12%", height: "0.9rem" }} />
        <div className="skeleton" style={{ width: "18%", height: "0.9rem" }} />
        <div className="skeleton" style={{ width: "22%", height: "0.9rem" }} />
      </div>
      <div className="skeleton" style={{ width: "55%", height: "0.9rem" }} />
      <div className="skeleton" style={{ width: "100%", height: "5rem" }} />
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
      if (sort === "name") return a.filename.localeCompare(b.filename);
      const aDate = safeDate(a.created_at)?.getTime() || 0;
      const bDate = safeDate(b.created_at)?.getTime() || 0;
      if (sort === "oldest") return aDate - bDate;
      return bDate - aDate;
    });
    return sorted;
  }, [filteredDocs, sort]);

  const totalCount = documents.length;
  const shownCount = visibleDocs.length;
  const isLoading = state.status === "loading";
  const showList = (state.status === "success" || (isLoading && shownCount)) && shownCount > 0;
  const showEmpty = state.status === "success" && shownCount === 0;

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
                <span className="tiny muted" aria-live="polite">
                  Updated {formatTime(lastLoaded, "Not yet loaded")}
                </span>
                <span className="muted tiny">
                  {shownCount ? `${shownCount} shown` : "No documents"}
                  {totalCount > shownCount && ` • ${totalCount} total`}
                </span>
                <button type="button" className="secondary" onClick={handleRefresh} disabled={isLoading}>
                  {isLoading ? "Refreshing…" : "Refresh"}
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

          {isLoading && (
            <div className="stack" style={{ gap: "0.75rem" }}>
              <div className="status-info">Loading documents…</div>
              <div className="stack" style={{ gap: "0.5rem" }}>
                {[1, 2, 3].map((item) => (
                  <DocumentSkeleton key={item} />
                ))}
              </div>
            </div>
          )}
          {state.status === "error" && <div className="status-error">{state.message || "Unable to load documents"}</div>}

          {showEmpty && <div className="status-info">No documents match this filter.</div>}

          {showList && (
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
