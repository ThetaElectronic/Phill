export default function DashboardPage() {
  return (
    <section className="grid" style={{ gap: "1.5rem" }}>
      <div className="stack">
        <div className="badge-list">
          <span className="pill">Operator view</span>
          <span className="pill pill-outline">Multi-tenant</span>
          <span className="pill pill-success">Live health</span>
        </div>
        <h1 style={{ margin: 0 }}>Dashboard</h1>
        <p className="muted" style={{ margin: 0 }}>
          This preview shows how the shell will summarize incidents, documents, and AI activity once API
          wiring is connected. Everything renders server-side to stay fast on low-resource hosts.
        </p>
      </div>

      <div className="grid two-col" style={{ alignItems: "stretch" }}>
        <div className="card stack">
          <h2>Signals</h2>
          <div className="grid" style={{ gap: "0.75rem" }}>
            <div className="stack">
              <span className="muted tiny">Incidents</span>
              <strong style={{ fontSize: "1.6rem" }}>—</strong>
              <span className="tiny muted">Will show open vs. resolved counts for the active company.</span>
            </div>
            <div className="divider" />
            <div className="stack">
              <span className="muted tiny">Documents</span>
              <strong style={{ fontSize: "1.6rem" }}>—</strong>
              <span className="tiny muted">Recently uploaded files and storage target (local or S3).</span>
            </div>
            <div className="divider" />
            <div className="stack">
              <span className="muted tiny">AI memory</span>
              <strong style={{ fontSize: "1.6rem" }}>—</strong>
              <span className="tiny muted">Usage and last stored prompt per company boundary.</span>
            </div>
          </div>
        </div>

        <div className="card stack">
          <h2>Next actions</h2>
          <div className="grid" style={{ gap: "0.75rem" }}>
            <div className="stack">
              <strong>Wire API clients</strong>
              <span className="muted tiny">
                Point your frontend fetcher at <code>NEXT_PUBLIC_API_URL</code> and hydrate these cards with
                real data.
              </span>
            </div>
            <div className="divider" />
            <div className="stack">
              <strong>Role-aware views</strong>
              <span className="muted tiny">
                Lock widgets by user role once auth is connected so supervisors and founders see tailored
                stats.
              </span>
            </div>
            <div className="divider" />
            <div className="stack">
              <strong>Realtime updates</strong>
              <span className="muted tiny">
                Hook WebSocket or SSE streams to incident events to keep the dashboard live.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
