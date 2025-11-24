"use client";

import { useEffect, useMemo, useState } from "react";

import AuthWall from "../../components/AuthWall";
import { fetchWithAuth, apiUrl } from "../../lib/api";
import { loadTokens } from "../../lib/auth";

export default function DocumentsClient({ session }) {
  const [tokens] = useState(() => session || loadTokens());
  const [documents, setDocuments] = useState([]);
  const [state, setState] = useState({ status: "idle" });

  const listUrl = useMemo(() => apiUrl("/documents"), []);

  useEffect(() => {
    if (!tokens) return;
    let cancelled = false;
    const fetchDocs = async () => {
      setState({ status: "loading" });
      try {
        const res = await fetchWithAuth("/documents", { headers: { Accept: "application/json" } });
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          const message = payload?.detail || `Request failed (${res.status})`;
          if (!cancelled) setState({ status: "error", message });
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setDocuments(data || []);
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
    <AuthWall session={tokens} title="Documents are protected" description="Sign in to view your company documents.">
      <section className="grid" style={{ gap: "1.5rem" }}>
        <div className="stack">
          <div className="badge-list">
            <span className="pill">Documents</span>
            <span className="pill pill-outline">Storage</span>
          </div>
          <h1 style={{ margin: 0 }}>Documents</h1>
          <p className="muted" style={{ margin: 0 }}>
            This view lists files from <code>{listUrl}</code> using your bearer token. Upload via the AI page or dedicated
            upload panel.
          </p>
        </div>

        <div className="card stack" style={{ gap: "1rem" }}>
          {state.status === "loading" && <div className="status-info">Loading documents…</div>}
          {state.status === "error" && <div className="status-error">{state.message || "Unable to load documents"}</div>}
          {state.status === "success" && documents.length === 0 && (
            <div className="muted tiny">No documents available yet.</div>
          )}
          {state.status === "success" && documents.length > 0 && (
            <div className="grid" style={{ gap: "0.75rem" }}>
              {documents.map((doc) => (
                <div key={doc.id} className="card surface stack" style={{ gap: "0.35rem" }}>
                  <div className="badge-list">
                    <span className="pill">{doc.name}</span>
                    <span className="pill pill-outline tiny">{doc.path}</span>
                  </div>
                  <div className="tiny muted">Company: {doc.company_id}</div>
                  <div className="tiny muted">Uploaded by: {doc.uploaded_by}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </AuthWall>
  );
}
