"use client";

import { useEffect, useMemo, useState } from "react";

import { formatDateTime, safeDate } from "../lib/dates";

import { apiUrl, getApiBase } from "../lib/api";
import { clearTokens, loadTokens } from "../lib/auth";

function decodeExp(accessToken) {
  if (!accessToken || typeof window === "undefined") return null;
  const parts = accessToken.split(".");
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(atob(parts[1]));
    if (!payload?.exp) return null;
    return safeDate(payload.exp * 1000);
  } catch (err) {
    console.warn("Unable to decode token exp", err);
    return null;
  }
}

export default function SessionIndicator({ label, compact = false }) {
  const [tokens, setTokens] = useState(null);

  useEffect(() => {
    setTokens(loadTokens());
  }, []);

  const expiry = useMemo(() => decodeExp(tokens?.access_token), [tokens]);
  const apiBase = useMemo(() => getApiBase(), []);
  const healthUrl = useMemo(() => apiUrl("/health"), []);

  if (compact) {
    return (
      <div className="chip" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
        <span className={`status-dot ${tokens ? "dot-on" : "dot-off"}`} />
        <span className="tiny muted" style={{ lineHeight: 1 }}>
          {tokens ? "Authenticated" : "Signed out"}
        </span>
        {label ? <strong style={{ fontSize: "0.85rem" }}>{label}</strong> : null}
      </div>
    );
  }

  return (
    <div className="session-card glass">
      <div className="session-row">
        <div className="pill tiny">Session</div>
        <div className={`status-chip ${tokens ? "status-on" : "status-off"}`}>
          {tokens ? "Authenticated" : "Not signed in"}
        </div>
      </div>
      <div className="session-meta">
        <div className="muted tiny">API base</div>
        <div className="mono small">{apiBase}</div>
      </div>
      <div className="session-meta">
        <div className="muted tiny">Health</div>
        <a className="mono small" href={healthUrl}>
          {healthUrl}
        </a>
      </div>
      {tokens ? (
        <div className="session-meta">
          <div className="muted tiny">Access token</div>
          <div className="mono tiny token-inline">{tokens.access_token.slice(0, 22)}…</div>
          <div className="muted tiny" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>Refresh: {tokens.refresh_token ? "present" : "missing"}</span>
            {expiry ? <span className="pill soft tiny">exp {formatDateTime(expiry)}</span> : null}
          </div>
        </div>
      ) : (
        <div className="muted tiny">Use the Login link above to generate tokens.</div>
      )}
      <div className="session-actions">
        <a className="pill" href="/login">
          Go to login
        </a>
        <button
          type="button"
          className="pill ghost"
          onClick={() => {
            clearTokens();
            setTokens(null);
          }}
        >
          Clear tokens
        </button>
      </div>
    </div>
  );
}
