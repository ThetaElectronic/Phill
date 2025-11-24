export default function ReviewIncidentsPage() {
  return (
    <section className="grid" style={{ gap: "1.5rem" }}>
      <div className="stack">
        <div className="badge-list">
          <span className="pill">Incidents</span>
          <span className="pill pill-outline">Review</span>
        </div>
        <h1 style={{ margin: 0 }}>Review incidents</h1>
        <p className="muted" style={{ margin: 0 }}>
          This view will show escalations and allow supervisors/managers to advance status. Lists will be
          filtered to the caller’s company unless a founder is logged in.
        </p>
      </div>

      <div className="card stack">
        <h2>Incoming queue</h2>
        <p className="muted tiny" style={{ margin: 0 }}>
          Populate from <code>/api/incidents</code> with status filters. Use the role guard dependency to
          authorize escalations.
        </p>
        <div className="divider" />
        <p className="muted tiny" style={{ margin: 0 }}>No incidents to show yet.</p>
      </div>
    </section>
  );
}
