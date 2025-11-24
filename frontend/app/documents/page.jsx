"use client";

import { useEffect, useMemo, useState } from "react";

import { bearerHeaders, loadTokens } from "../../lib/auth";
import { apiUrl } from "../../lib/api";

export default function DocumentsPage() {
  const [tokens, setTokens] = useState(null);
  const [docs, setDocs] = useState([]);
  const [state, setState] = useState({ status: "idle" });
  const [uploadState, setUploadState] = useState({ status: "idle" });
  const [selectedFile, setSelectedFile] = useState(null);

  const listUrl = useMemo(() => apiUrl("/documents"), []);
  const uploadUrl = useMemo(() => apiUrl("/documents/upload"), []);

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
        if (!cancelled)
          setState({ status: "error", message: error instanceof Error ? error.message : "Unable to load documents" });
      }
    };

    fetchDocs();
    return () => {
      cancelled = true;
    };
  }, [listUrl, tokens]);

  const handleUpload = async (event) => {
    event.preventDefault();
    if (!tokens) {
      setUploadState({ status: "error", message: "Sign in first" });
      return;
    }
    if (!selectedFile) {
      setUploadState({ status: "error", message: "Choose a file to upload" });
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    setUploadState({ status: "loading" });
    try {
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { ...bearerHeaders(tokens) },
        body: formData,
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        const message = payload?.detail || `Upload failed (${res.status})`;
        setUploadState({ status: "error", message });
        return;
      }

      const data = await res.json();
      setDocs((prev) => [data, ...prev]);
      setSelectedFile(null);
      setUploadState({ status: "success", message: "Uploaded" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to upload";
      setUploadState({ status: "error", message });
    }
  };

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
          <h2>Upload a document</h2>
          <p className="muted tiny" style={{ margin: 0 }}>
            Files are sent to <code>{uploadUrl}</code> with your bearer token, then stored under your company.
          </p>
          <div className="divider" />

          <form className="grid" style={{ gap: "0.75rem" }} onSubmit={handleUpload}>
            <label>
              Select file
              <input
                type="file"
                name="file"
                onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
              />
            </label>

            <div className="grid two-col" style={{ gap: "0.5rem" }}>
              <button type="submit" disabled={uploadState.status === "loading"}>
                {uploadState.status === "loading" ? "Uploading…" : "Upload"}
              </button>
              <button type="button" className="ghost" onClick={() => setSelectedFile(null)}>
                Clear selection
              </button>
            </div>
          </form>

          {uploadState.status === "error" && <div className="status-error">{uploadState.message}</div>}
          {uploadState.status === "success" && <div className="status-success tiny">{uploadState.message}</div>}
        </div>
      </div>
    </section>
  );
}
