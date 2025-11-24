"use client";

import AuthWall from "../../../components/AuthWall";

export default function ManageCompaniesPage() {
  return (
    <AuthWall title="Company management is protected" description="Sign in as a founder or admin to view company settings.">
      <section className="stack" style={{ gap: "0.75rem" }}>
        <div className="badge-list">
          <span className="pill">Companies</span>
          <span className="pill pill-outline">Management</span>
        </div>
        <h1 style={{ margin: 0 }}>Manage companies</h1>
        <p className="muted" style={{ margin: 0 }}>
          Company settings, storage options, and tenant configuration will surface here after authentication.
        </p>
        <div className="status-info">Sign in to view the live tenant list.</div>
      </section>
    </AuthWall>
  );
}
