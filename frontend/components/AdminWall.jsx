"use client";

import { useEffect, useState } from "react";

import { clearTokens, loadTokens } from "../lib/auth";
import { fetchWithAuth } from "../lib/api";
import AuthWall from "./AuthWall";

export default function AdminWall({ children, title = "Admin access required", description }) {
  const [state, setState] = useState({ status: "checking", message: "", profile: null });

  useEffect(() => {
    let active = true;

    const verify = async () => {
      const tokens = loadTokens();
      if (!tokens) {
        if (active) setState({ status: "unauthenticated", message: "", profile: null });
        return;
      }

      try {
        const res = await fetchWithAuth("/api/users/me");
        if (!res.ok) {
          const status = res.status === 403 ? "forbidden" : "error";
          const message = res.status === 403 ? "Admins only" : `Unable to verify access (${res.status})`;
          if (active) setState({ status, message, profile: null });
          return;
        }
        const profile = await res.json();
        if (profile?.role !== "admin") {
          if (active) setState({ status: "forbidden", message: "Admins only", profile: null });
          return;
        }
        if (active) setState({ status: "ready", message: "", profile });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to verify access";
        if (active) setState({ status: "error", message, profile: null });
      }
    };

    verify();
    return () => {
      active = false;
    };
  }, []);

  if (state.status === "checking") {
    return (
      <AuthWall title="Checking admin access" description="Confirming your permissions…">
        <div className="card glass stack" style={{ gap: "0.35rem" }}>
          <div className="pill pill-soft">Loading…</div>
          <p className="muted tiny" style={{ margin: 0 }}>Preparing admin tools.</p>
        </div>
      </AuthWall>
    );
  }

  if (state.status === "unauthenticated") {
    return (
      <AuthWall title={title} description={description || "Sign in with an admin account to continue."}>
        <div className="card glass stack" style={{ gap: "0.4rem" }}>
          <div className="pill pill-error">Login required</div>
          <p className="muted" style={{ margin: 0 }}>Use an admin account to access this area.</p>
          <div className="chip-row" style={{ gap: "0.35rem" }}>
            <a className="chip" href="/login">
              Go to login
            </a>
            <button className="chip ghost" type="button" onClick={() => clearTokens()}>
              Clear saved tokens
            </button>
          </div>
        </div>
      </AuthWall>
    );
  }

  if (state.status === "forbidden") {
    return (
      <AuthWall title={title} description={description || "You need admin permissions to view this page."}>
        <div className="card glass stack" style={{ gap: "0.4rem" }}>
          <div className="pill pill-error">Admins only</div>
          <p className="muted" style={{ margin: 0 }}>{state.message || "Please contact an administrator for access."}</p>
          <div className="chip-row" style={{ gap: "0.35rem" }}>
            <a className="chip secondary" href="/dashboard">
              Back to dashboard
            </a>
          </div>
        </div>
      </AuthWall>
    );
  }

  if (state.status === "error") {
    return (
      <AuthWall title={title} description={description || "Unable to verify admin permissions right now."}>
        <div className="card glass stack" style={{ gap: "0.4rem" }}>
          <div className="pill pill-outline">Check failed</div>
          <p className="muted" style={{ margin: 0 }}>{state.message || "Please try again in a moment."}</p>
        </div>
      </AuthWall>
    );
  }

  return typeof children === "function" ? children(state.profile) : children;
}
