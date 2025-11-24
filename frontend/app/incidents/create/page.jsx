export default function CreateIncidentPage() {
  return (
    <section className="grid" style={{ gap: "1.5rem" }}>
      <div className="stack">
        <div className="badge-list">
          <span className="pill">Incidents</span>
          <span className="pill pill-warning">Workflow</span>
        </div>
        <h1 style={{ margin: 0 }}>Create incident</h1>
        <p className="muted" style={{ margin: 0 }}>
          This form will submit to <code>/api/incidents</code> with the authenticated user and company
          derived server-side. Fields are placeholders until the client wiring is finished.
        </p>
      </div>

      <div className="card grid" style={{ gap: "1rem" }}>
        <form>
          <label>
            Title / Type
            <input name="type" placeholder="Safety, security, compliance..." required />
          </label>
          <label>
            Description
            <textarea name="description" rows={4} placeholder="What happened?" required />
          </label>
          <div className="grid two-col">
            <label>
              Priority
              <select name="priority" defaultValue="">
                <option value="" disabled>
                  Select priority
                </option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
            <label>
              Visibility
              <select name="visibility" defaultValue="">
                <option value="" disabled>
                  Company only (default)
                </option>
                <option value="company">Company only</option>
                <option value="managers">Managers</option>
              </select>
            </label>
          </div>
          <button type="button">Save incident (stub)</button>
        </form>
        <div className="tiny muted">
          <div className="divider" />
          Tenant scoping is enforced API-side; the UI only collects the payload and sends your bearer token.
        </div>
      </div>
    </section>
  );
}
