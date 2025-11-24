"use client";

import { useEffect, useState } from "react";

import { clearTokens, loadTokens } from "../lib/auth";

export default function AuthWall({ children, title = "Login required", description }) {
  const [tokens, setTokens] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setTokens(loadTokens());
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="card lock-wall">
        <div className="stack" style={{ gap: "0.25rem" }}>
          <div className="pill pill-soft">Checking session…</div>
          <div className="muted tiny">Preparing the page</div>
        </div>
      </div>
    );
  }

  if (!tokens) {
    return (
      <div className="card lock-wall">
        <div className="stack" style={{ gap: "0.35rem" }}>
          <div className="pill pill-error">Login required</div>
          <div className="stack" style={{ gap: "0.2rem" }}>
            <strong>{title}</strong>
            <p className="muted tiny" style={{ margin: 0 }}>
              {description || "Sign in first to view this area. Use your founder or admin account to explore all features."}
            </p>
          </div>
          <div className="chip-row" style={{ gap: "0.35rem" }}>
            <a className="chip" href="/login">Go to login</a>
            <a className="chip ghost" href="/">Back home</a>
          </div>
          <div className="tiny muted">If you see stale tokens, use the reset button below.</div>
          <button className="ghost" type="button" onClick={() => clearTokens()}>Clear saved tokens</button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
