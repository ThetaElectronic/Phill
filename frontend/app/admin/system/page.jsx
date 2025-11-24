"use client";

import AuthWall from "../../../components/AuthWall";

export default function AdminSystemPage() {
  return (
    <AuthWall title="Admin system panel is protected" description="Login with admin permissions to view system checks and metrics.">
      <section className="stack" style={{ gap: "0.75rem" }}>
        <div className="badge-list">
          <span className="pill">Admin</span>
          <span className="pill pill-outline">System</span>
        </div>
        <h1 style={{ margin: 0 }}>System checks</h1>
        <p className="muted" style={{ margin: 0 }}>
          Health, metrics, and audit views are only available to authenticated admins.
        </p>
        <div className="status-info">Sign in to load live system telemetry.</div>
      </section>
    </AuthWall>
  );
}
