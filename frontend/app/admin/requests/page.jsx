"use client";

import { useEffect, useMemo, useState } from "react";

import AdminWall from "../../../components/AdminWall";
import { fetchWithAuth } from "../../../lib/api";

function formatTimestamp(value) {
  if (!value) return "Timestamp pending";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Timestamp pending";
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
}

function RequestsCard({ title, description, items, loading, error, total }) {
  const filteredOut = typeof total === "number" && total > 0 && (items?.length || 0) === 0;
  return (
    <section className="card surface stack" style={{ gap: "0.75rem" }}>
      <div className="stack" style={{ gap: "0.25rem" }}>
        <div className="badge-list">
          <span className="pill">Admin</span>
          <span className="pill pill-outline">{title}</span>
        </div>
        <div className="stack" style={{ gap: "0.1rem" }}>
          <h2 style={{ margin: 0 }}>{title}</h2>
          <p className="muted" style={{ margin: 0 }}>
            {description}
          </p>
        </div>
      </div>
      <div className="chip-row" style={{ gap: "0.35rem", alignItems: "center" }}>
        {typeof total === "number" && (
          <span className="pill pill-outline">{items?.length || 0} shown</span>
        )}
        {typeof total === "number" && total !== items?.length && (
          <span className="pill">{total} total</span>
        )}
      </div>
      {loading && <div className="muted">Loading…</div>}
      {error && (
        <div className="status error">
          <strong>Could not load</strong>
          <div className="muted tiny">{error}</div>
        </div>
      )}
      {!loading && !error && items?.length === 0 && (
        <div className="status muted">
          {filteredOut ? "No results match the filters." : "No entries yet."}
        </div>
      )}
      {!loading && !error && items?.length > 0 && (
        <div className="list">
          {items.map((item) => (
            <div key={item.id} className="list-row">
              <div className="stack" style={{ gap: "0.1rem" }}>
                <div className="strong">{item.email}</div>
                {item.note && <div className="muted tiny">Note: {item.note}</div>}
                <div className="muted tiny">{formatTimestamp(item.created_at || item.createdAt)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function AdminRequestsPage() {
  const [accessRequests, setAccessRequests] = useState([]);
  const [resetRequests, setResetRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [accessRes, resetRes] = await Promise.all([
        fetchWithAuth("/api/admin/requests/access"),
        fetchWithAuth("/api/admin/requests/password-resets"),
      ]);

      if (!accessRes.ok) {
        throw new Error(await accessRes.text());
      }
      if (!resetRes.ok) {
        throw new Error(await resetRes.text());
      }

      const [accessData, resetData] = await Promise.all([
        accessRes.json(),
        resetRes.json(),
      ]);

      setAccessRequests(accessData);
      setResetRequests(resetData);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || "Unable to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const normalizedSearch = search.trim().toLowerCase();
  const sortItems = (items) => {
    const sorted = [...items].sort((a, b) => {
      const aDate = new Date(a.created_at || a.createdAt || "").getTime() || 0;
      const bDate = new Date(b.created_at || b.createdAt || "").getTime() || 0;
      if (sortBy === "oldest") return aDate - bDate;
      return bDate - aDate;
    });

    if (!normalizedSearch) return sorted;

    return sorted.filter((item) => {
      const haystack = `${item.email || ""} ${item.note || ""} ${item.created_at || ""}`.toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  };

  const filteredAccess = useMemo(() => sortItems(accessRequests), [accessRequests, normalizedSearch, sortBy]);
  const filteredReset = useMemo(() => sortItems(resetRequests), [resetRequests, normalizedSearch, sortBy]);

  const resetFilters = () => {
    setSearch("");
    setSortBy("newest");
  };

  return (
    <AdminWall title="Admin requests" description="View access and password reset submissions.">
      <div className="stack" style={{ gap: "1rem" }}>
        <header className="stack" style={{ gap: "0.35rem" }}>
          <div className="badge-list">
            <span className="pill">Admin</span>
            <span className="pill pill-outline">Requests</span>
          </div>
          <h1 style={{ margin: 0 }}>Auth requests</h1>
          <p className="muted" style={{ margin: 0 }}>
            Review access requests and password reset submissions captured from the login page.
          </p>
          <div className="chip-row" style={{ alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <div className="chip-row" style={{ gap: "0.35rem", alignItems: "center" }}>
              <input
                type="search"
                placeholder="Search email or note"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input"
                style={{ minWidth: "240px" }}
              />
              <div className="chip-row" style={{ gap: "0.35rem", flexWrap: "wrap" }}>
                {[
                  { key: "newest", label: "Newest" },
                  { key: "oldest", label: "Oldest" },
                ].map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    className={sortBy === option.key ? "pill" : "pill pill-outline"}
                    onClick={() => setSortBy(option.key)}
                    aria-pressed={sortBy === option.key}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <button type="button" className="ghost" onClick={resetFilters} disabled={!search && sortBy === "newest"}>
                Reset
              </button>
            </div>
            <div className="chip-row" style={{ gap: "0.35rem", alignItems: "center" }}>
              <button type="button" className="secondary" onClick={load} disabled={loading}>
                {loading ? "Refreshing…" : "Refresh"}
              </button>
              {lastUpdated && (
                <span className="tiny muted">Updated {lastUpdated.toLocaleTimeString()}</span>
              )}
              {error && <span className="status-error">{error}</span>}
            </div>
          </div>
        </header>
        <div className="grid two-col" style={{ gap: "1rem" }}>
          <RequestsCard
            title="Access requests"
            description="Requests to gain access with optional notes for follow-up."
            items={filteredAccess}
            loading={loading}
            error={error}
            total={accessRequests.length}
          />
          <RequestsCard
            title="Password reset requests"
            description="Recent reset submissions with metadata for auditing."
            items={filteredReset}
            loading={loading}
            error={error}
            total={resetRequests.length}
          />
        </div>
      </div>
    </AdminWall>
  );
}
