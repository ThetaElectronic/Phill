import AuthWall from "../../components/AuthWall";
import { getSessionOrRedirect, serverFetchWithAuth } from "../../lib/session";

async function loadDashboardData(session) {
  try {
    const [incidentsRes, documentsRes, profileRes] = await Promise.all([
      serverFetchWithAuth("/incidents", session),
      serverFetchWithAuth("/documents", session),
      serverFetchWithAuth("/users/me", session),
    ]);
    const incidents = incidentsRes.ok ? await incidentsRes.json() : [];
    const documents = documentsRes.ok ? await documentsRes.json() : [];
    const profile = profileRes.ok ? await profileRes.json() : null;
    return { incidents, documents, profile };
  } catch (error) {
    return {
      incidents: [],
      documents: [],
      profile: null,
      error: error instanceof Error ? error.message : "Unable to load data",
    };
  }
}

export default async function DashboardPage() {
  const session = await getSessionOrRedirect("/dashboard");
  const data = await loadDashboardData(session);
  const openIncidents = Array.isArray(data.incidents)
    ? data.incidents.filter((item) => item.status === "open").length
    : 0;

  return (
    <AuthWall
      session={session}
      title="Dashboard"
      description="A quick glance at what matters for your team."
    >
      <section className="stack" style={{ gap: "1rem" }}>
        <div className="card glass stack" style={{ gap: "0.75rem" }}>
          <div className="stack" style={{ gap: "0.25rem" }}>
            <span className="pill pill-outline">Overview</span>
            <h1 style={{ margin: 0 }}>Workspace status</h1>
            <p className="muted" style={{ margin: 0 }}>
              Simple signals for your company. No extra banners or previews until you sign in.
            </p>
          </div>
          <div className="grid two-col" style={{ gap: "1rem" }}>
            <div className="card surface stack" style={{ gap: "0.35rem" }}>
              <span className="muted tiny">Open incidents</span>
              <strong style={{ fontSize: "1.6rem" }}>{openIncidents || "—"}</strong>
              <span className="tiny muted">Company scoped.</span>
            </div>
            <div className="card surface stack" style={{ gap: "0.35rem" }}>
              <span className="muted tiny">Documents</span>
              <strong style={{ fontSize: "1.6rem" }}>{data.documents?.length ?? "—"}</strong>
              <span className="tiny muted">Latest uploads only.</span>
            </div>
          </div>
          {data.error && <div className="status-error">{data.error}</div>}
        </div>

          <div className="card glass stack" style={{ gap: "0.5rem" }}>
            <h2 style={{ margin: 0 }}>Quick links</h2>
            <div className="pill-row">
            <a className="pill" href="/incidents/create">
              New incident
            </a>
            <a className="pill" href="/documents">
              Documents
            </a>
              <a className="pill" href="/ai">
                AI assistant
              </a>
              <a className="pill" href="/tickets">
                Tickets
              </a>
              <a className="pill pill-soft" href="/account">
                Account
              </a>
              {data.profile?.role === "admin" && (
                <a className="pill pill-outline" href="/admin">
                  Admin
                </a>
              )}
            </div>
          </div>
      </section>
    </AuthWall>
  );
}
