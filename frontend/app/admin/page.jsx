"use client";

import AdminWall from "../../components/AdminWall";

function AdminCard({ title, description, href, badge }) {
  return (
    <a className="card glass stack" style={{ gap: "0.4rem" }} href={href}>
      <div className="badge-list">
        <span className="pill">Admin</span>
        {badge && <span className="pill pill-outline">{badge}</span>}
      </div>
      <h2 style={{ margin: 0 }}>{title}</h2>
      <p className="muted" style={{ margin: 0 }}>{description}</p>
      <span className="chip secondary" style={{ alignSelf: "flex-start" }}>
        Open
      </span>
    </a>
  );
}

export default function AdminHomePage() {
  return (
    <AdminWall title="Admin workspace" description="Only admins can view these tools.">
      <section className="stack" style={{ gap: "1rem", maxWidth: "1040px" }}>
        <div className="stack" style={{ gap: "0.35rem" }}>
          <div className="badge-list">
            <span className="pill">Admin</span>
            <span className="pill pill-outline">Workspace</span>
          </div>
          <h1 style={{ margin: 0 }}>Admin tools</h1>
          <p className="muted" style={{ margin: 0 }}>
            Focused controls for your team. Technical diagnostics stay separate so day-to-day views stay clean.
          </p>
        </div>

        <div className="grid two-col" style={{ gap: "1rem" }}>
          <AdminCard
            title="System health"
            description="Check database, SMTP, and AI readiness at a glance."
            href="/admin/system"
            badge="Status"
          />
          <AdminCard
            title="Diagnostics"
            description="View raw payloads, latency details, and copy helpers for support."
            href="/admin/diagnostics"
            badge="Advanced"
          />
          <AdminCard
            title="Training files"
            description="Review, scope, or remove uploaded AI documents."
            href="/admin/documents"
            badge="AI"
          />
          <AdminCard
            title="Users"
            description="List company users, add teammates, or reset passwords."
            href="/admin/users"
            badge="Accounts"
          />
          <AdminCard
            title="Requests"
            description="Review access and password reset submissions from the login page."
            href="/admin/requests"
            badge="Auth"
          />
          <AdminCard
            title="Email"
            description="Edit onboarding templates and send a quick SMTP test before enabling notifications."
            href="/admin/email"
            badge="Notifications"
          />
        </div>
      </section>
    </AdminWall>
  );
}
