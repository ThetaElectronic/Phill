import AuthWall from "../../components/AuthWall";
import { getSessionOrRedirect, serverFetchWithAuth } from "../../lib/session";

async function loadDashboardData(session) {
  try {
    const [incidentsRes, documentsRes] = await Promise.all([
      serverFetchWithAuth("/incidents", session),
      serverFetchWithAuth("/documents", session),
    ]);
    const incidents = incidentsRes.ok ? await incidentsRes.json() : [];
    const documents = documentsRes.ok ? await documentsRes.json() : [];
    return { incidents, documents };
  } catch (error) {
    return { incidents: [], documents: [], error: error instanceof Error ? error.message : "Unable to load data" };
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
      title="Dashboard is protected"
      description="Sign in to explore the dashboard panels and activity cards."
    >
      <section className="grid" style={{ gap: "1.5rem" }}>
        <div className="card gradient-card" style={{ position: "relative", overflow: "hidden" }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at 22% 30%, rgba(255,255,255,0.14) 0, transparent 38%), radial-gradient(circle at 82% 16%, rgba(255,255,255,0.18) 0, transparent 32%)",
              pointerEvents: "none",
            }}
            aria-hidden
          />
          <div className="stack" style={{ gap: "0.65rem" }}>
            <div className="badge-list">
              <span className="pill">Operator view</span>
              <span className="pill pill-outline">Multi-tenant</span>
              <span className="pill pill-success">Live health</span>
            </div>
            <h1 style={{ margin: 0 }}>Dashboard</h1>
            <p className="muted" style={{ margin: 0 }}>
              A showcase of the shell once data is wired: incidents, documents, and AI activity with role-aware
              visibility. Everything renders server-side for speed on small hosts.
            </p>
            <div className="stat-bar" aria-hidden>
              <span style={{ width: "65%" }} />
            </div>
            <div className="floating-badges">
              <span className="pill">/incidents</span>
              <span className="pill">/documents</span>
              <span className="pill">/ai</span>
            </div>
          </div>
        </div>

        <div className="grid two-col" style={{ alignItems: "stretch" }}>
          <div className="card stack">
            <h2>Signals</h2>
            <div className="grid" style={{ gap: "0.75rem" }}>
              <div className="stack">
                <span className="muted tiny">Incidents</span>
                <strong style={{ fontSize: "1.6rem" }}>{openIncidents || "Awaiting data"}</strong>
                <span className="tiny muted">Open vs. resolved counts are scoped to your company.</span>
              </div>
              <div className="divider" />
              <div className="stack">
                <span className="muted tiny">Documents</span>
                <strong style={{ fontSize: "1.6rem" }}>{data.documents?.length ?? "Awaiting"}</strong>
                <span className="tiny muted">Recent files and storage target (local or S3) show in this panel.</span>
              </div>
              <div className="divider" />
              <div className="stack">
                <span className="muted tiny">AI memory</span>
                <strong style={{ fontSize: "1.6rem" }}>Scoped</strong>
                <span className="tiny muted">Usage and last stored prompt per company boundary.</span>
              </div>
            </div>
            {data.error && <div className="status-error">{data.error}</div>}
          </div>

          <div className="card stack">
            <h2>Next actions</h2>
            <div className="grid" style={{ gap: "0.75rem" }}>
              <div className="stack accent-rail">
                <strong>Wire API clients</strong>
                <span className="muted tiny">
                  Point your frontend fetcher at <code>NEXT_PUBLIC_API_URL</code> and hydrate these cards with real data.
                </span>
              </div>
              <div className="divider" />
              <div className="stack accent-rail">
                <strong>Role-aware views</strong>
                <span className="muted tiny">
                  Lock widgets by user role so supervisors and admins see tailored stats once tokens are stored.
                </span>
              </div>
              <div className="divider" />
              <div className="stack accent-rail">
                <strong>Realtime updates</strong>
                <span className="muted tiny">
                  Hook WebSocket or SSE streams to incident events to keep the dashboard live.
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="hero-bento">
          <div className="bento-card">
            <h3>Incident workflow</h3>
            <div className="timeline">
              <div className="timeline-item">
                <strong>Report</strong>
                <div className="tiny muted">Create incidents from /incidents/create with bearer auth.</div>
              </div>
              <div className="timeline-item">
                <strong>Review</strong>
                <div className="tiny muted">Supervisors+ can escalate or close from /incidents/review.</div>
              </div>
              <div className="timeline-item">
                <strong>Audit</strong>
                <div className="tiny muted">Audit tables track who moved the item and when.</div>
              </div>
            </div>
          </div>
          <div className="bento-card">
            <h3>Documents</h3>
            <div className="stack" style={{ gap: "0.45rem" }}>
              <div className="badge-list">
                <span className="pill">Upload</span>
                <span className="pill pill-outline">List</span>
                <span className="pill pill-success">Scoped</span>
              </div>
              <div className="tiny muted">Uploads are tenant-aware and refresh the list live after a successful POST.</div>
              <div className="stat-bar" aria-hidden>
                <span style={{ width: "55%" }} />
              </div>
            </div>
          </div>
          <div className="bento-card">
            <h3>AI assistant</h3>
            <div className="stack" style={{ gap: "0.4rem" }}>
              <div className="tiny muted">GPT-5.1 with optional company memory and safety guardrails.</div>
              <div className="badge-list">
                <span className="pill">Memory toggle</span>
                <span className="pill pill-outline">System prompt</span>
                <span className="pill pill-success">Bearer required</span>
              </div>
              <div className="tiny muted">
                Use the AI page to chat, optionally persist memory, and inspect the JSON responses.
              </div>
            </div>
          </div>
        </div>
      </section>
    </AuthWall>
  );
}
