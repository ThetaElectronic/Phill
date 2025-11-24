"use client";

import { useEffect, useMemo, useState } from "react";

import { bearerHeaders, loadTokens } from "../../lib/auth";
import { apiUrl } from "../../lib/api";

export default function DocumentsPage() {
  const [tokens, setTokens] = useState(null);
  const [docs, setDocs] = useState([]);
  const [state, setState] = useState({ status: "idle" });

  const listUrl = useMemo(() => apiUrl("/documents"), []);

  useEffect(() => {
    setTokens(loadTokens());
  }, []);

  useEffect(() => {
    if (!tokens) return;
    let cancelled = false;

    const fetchDocs = async () => {
      setState({ status: "loading" });
      try {
        const res = await fetch(listUrl, { headers: { ...bearerHeaders(tokens) } });
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          const message = payload?.detail || `Request failed (${res.status})`;
          if (!cancelled) setState({ status: "error", message });
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setDocs(data || []);
          setState({ status: "success" });
        }
      } catch (error) {
        if (!cancelled) setState({ status: "error", message: error instanceof Error ? error.message : "Unable to load documents" });
      }
    };

    fetchDocs();
    return () => {
      cancelled = true;
    };
  }, [listUrl, tokens]);

  return (
    <section className="grid" style={{ gap: "1.5rem" }}>
      <div className="stack">
        <div className="badge-list">
          <span className="pill">Documents</span>
          <span className="pill pill-outline">Local / S3</span>
        </div>
        <h1 style={{ margin: 0 }}>Documents</h1>
        <p className="muted" style={{ margin: 0 }}>
          This view pulls live documents from <code>{listUrl}</code>. Uploads stay scoped to your company; S3
          can be enabled via configuration.
        </p>
      </div>

      <div className="grid two-col">
        <div className="card stack" style={{ gap: "1rem" }}>
          <h2>Recent uploads</h2>
          <p className="muted tiny" style={{ margin: 0 }}>
            Requires a valid bearer token. Log in first, then refresh to see your tenant’s documents.
          </p>
          <div className="divider" />

          {!tokens && <div className="status-info">Sign in to load documents. Tokens are stored locally.</div>}

          {state.status === "loading" && <div className="status-info">Loading documents…</div>}

          {state.status === "error" && <div className="status-error">{state.message || "Unable to load documents"}</div>}

          {state.status === "success" && docs.length === 0 && <div className="muted tiny">No documents uploaded yet.</div>}

          {state.status === "success" && docs.length > 0 && (
            <div className="grid" style={{ gap: "0.75rem" }}>
              {docs.map((doc) => (
                <div key={doc.id} className="card surface stack" style={{ gap: "0.4rem" }}>
                  <div className="badge-list">
                    <span className="pill">{doc.name}</span>
                  </div>
                  <div className="tiny muted grid" style={{ gap: "0.1rem" }}>
                    <div>Path: {doc.path}</div>
                    <div>Company: {doc.company_id}</div>
                    <div>Uploaded by: {doc.uploaded_by}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card stack">
          <h2>Storage target</h2>
          <p className="muted tiny" style={{ margin: 0 }}>
            Reads company settings to choose S3 or local disk. Defaults to local in development.
          </p>
          <div className="divider" />
          <div className="pill pill-outline" style={{ width: "fit-content" }}>
            Awaiting config
          </div>
        </div>
      </div>
    </section>
  );
}
