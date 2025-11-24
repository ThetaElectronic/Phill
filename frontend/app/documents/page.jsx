export default function DocumentsPage() {
  return (
    <section className="grid" style={{ gap: "1.5rem" }}>
      <div className="stack">
        <div className="badge-list">
          <span className="pill">Documents</span>
          <span className="pill pill-outline">Local / S3</span>
        </div>
        <h1 style={{ margin: 0 }}>Documents</h1>
        <p className="muted" style={{ margin: 0 }}>
          Uploads will respect the company storage toggle. This view will show recent files and surface
          the active storage backend once API hooks are connected.
        </p>
      </div>

      <div className="grid two-col">
        <div className="card stack">
          <h2>Recent uploads</h2>
          <p className="muted tiny" style={{ margin: 0 }}>
            Populate from <code>/api/documents</code>; includes uploader and created date.
          </p>
          <div className="divider" />
          <p className="muted tiny" style={{ margin: 0 }}>No documents yet.</p>
        </div>

        <div className="card stack">
          <h2>Storage target</h2>
          <p className="muted tiny" style={{ margin: 0 }}>
            Reads company settings to choose S3 or local disk. Defaults to local in development.
          </p>
          <div className="divider" />
          <div className="pill pill-outline" style={{ width: "fit-content" }}>
            Awaiting config
          </div>
        </div>
      </div>
    </section>
  );
}
