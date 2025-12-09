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
          <h1 style={{ margin: 0 }}>Keep Phill focused</h1>
          <p className="muted" style={{ margin: 0 }}>
            Quick admin shortcuts that keep Phill AI and its training files front and center, without extra clutter.
          </p>
        </div>

        <div className="grid two-col" style={{ gap: "1rem" }}>
          <AdminCard
            title="AI readiness"
            description="Confirm database, SMTP, and model wiring so Phill can respond reliably."
            href="/admin/system"
            badge="Status"
          />
          <AdminCard
            title="Training files"
            description="Review, scope, or remove uploaded AI documents for any company."
            href="/admin/documents"
            badge="AI"
          />
          <AdminCard
            title="Accounts & access"
            description="Manage users, reset passwords, and handle access requests from one place."
            href="/admin/users"
            badge="Accounts"
          />
          <AdminCard
            title="Email"
            description="Edit onboarding templates and send a quick SMTP test before enabling notifications."
            href="/admin/email"
            badge="Notifications"
          />
        </div>

        <div className="chip-row" style={{ gap: "0.6rem", flexWrap: "wrap" }}>
          <span className="tiny muted">More tools:</span>
          <a className="chip ghost" href="/admin/diagnostics">
            Diagnostics
          </a>
          <a className="chip ghost" href="/admin/requests">
            Requests
          </a>
        </div>
      </section>
    </AdminWall>
  );
}
