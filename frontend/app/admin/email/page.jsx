"use client";

import AuthWall from "../../../components/AuthWall";

export default function AdminEmailPage() {
  return (
    <AuthWall title="Email admin is protected" description="Login with admin permissions to manage outbound templates and tests.">
      <section className="stack" style={{ gap: "0.75rem" }}>
        <div className="badge-list">
          <span className="pill">Admin</span>
          <span className="pill pill-outline">Email</span>
        </div>
        <h1 style={{ margin: 0 }}>Email templates</h1>
        <p className="muted" style={{ margin: 0 }}>
          SMTP configuration and template editing require authentication. Sign in to access the controls.
        </p>
        <div className="status-info">Sign in to view and send test messages.</div>
      </section>
    </AuthWall>
  );
}
