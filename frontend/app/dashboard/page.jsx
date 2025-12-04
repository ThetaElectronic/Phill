import AuthWall from "../../components/AuthWall";
import ThemeToggle from "../../components/ThemeToggle";
import { getSessionOrRedirect, serverFetchWithAuth } from "../../lib/session";
import { formatDateTime } from "../../lib/dates";
import AiPanelWrapper from "./AiPanelWrapper";

async function loadDashboardData(session) {
  try {
    const [incidentsRes, documentsRes, profileRes, aiStatusRes] = await Promise.all([
      serverFetchWithAuth("/incidents", session),
      serverFetchWithAuth("/documents", session),
      serverFetchWithAuth("/users/me", session),
      serverFetchWithAuth("/ai/status", session),
    ]);
    const incidents = incidentsRes.ok ? await incidentsRes.json() : [];
    const documents = documentsRes.ok ? await documentsRes.json() : [];
    const profile = profileRes.ok ? await profileRes.json() : null;
    const aiStatus = aiStatusRes.ok ? await aiStatusRes.json() : null;
    return { incidents, documents, profile, aiStatus };
  } catch (error) {
    return {
      incidents: [],
      documents: [],
      profile: null,
      aiStatus: null,
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
  const aiReady = data.aiStatus?.ok !== false;
  const aiChecked = data.aiStatus?.checked_at ? formatDateTime(data.aiStatus.checked_at) : null;

  return (
    <AuthWall session={session} title="Phill AI" description="Your focused hub for chatting with Phill and managing training files.">
      <section className="stack" style={{ gap: "1rem" }}>
        <div className="card glass stack" style={{ gap: "0.5rem" }}>
          <div className="stack" style={{ gap: "0.15rem" }}>
            <h1 style={{ margin: 0 }}>Dashboard</h1>
            <p className="muted" style={{ margin: 0 }}>
              Keep an eye on the essentials and jump straight into Phill AI. Dark mode and logout live here for quick access.
            </p>
          </div>
          <div className="grid two-col" style={{ gap: "1rem", alignItems: "stretch" }}>
            <div className="card surface stack" style={{ gap: "0.35rem" }}>
              <span className="muted tiny">Open incidents</span>
              <strong style={{ fontSize: "1.6rem" }}>{openIncidents || "—"}</strong>
              <span className="tiny muted">Company scoped</span>
            </div>
            <div className="card surface stack" style={{ gap: "0.35rem" }}>
              <span className="muted tiny">Training documents</span>
              <strong style={{ fontSize: "1.6rem" }}>{data.documents?.length ?? "—"}</strong>
              <span className="tiny muted">Latest uploads</span>
            </div>
            <div className="card surface stack" style={{ gap: "0.35rem" }}>
              <span className="muted tiny">Phill AI</span>
              <div className="chip-row" style={{ alignItems: "center", gap: "0.35rem" }}>
                <span className={`status-chip ${aiReady ? "ok" : "error"}`}>{aiReady ? "Ready" : "Needs setup"}</span>
                {data.aiStatus?.model && <span className="pill pill-outline">{data.aiStatus.model}</span>}
              </div>
              <span className="tiny muted">
                {aiReady
                  ? "AI can answer prompts and use training files."
                  : data.aiStatus?.detail || "Add OPENAI_API_KEY and AI_MODEL to enable Phill."}
              </span>
              {aiChecked && <span className="tiny muted">Checked {aiChecked}</span>}
            </div>
          </div>
          <div className="chip-row" style={{ justifyContent: "flex-start", gap: "0.75rem", flexWrap: "wrap" }}>
            <ThemeToggle className="secondary" />
            <a className="secondary" href="/account">Account</a>
            {data.profile?.role === "admin" && (
              <a className="secondary" href="/admin">
                Admin workspace
              </a>
            )}
            <a className="secondary" href="/documents">Training files</a>
          </div>
          {data.error && <div className="status-error">{data.error}</div>}
        </div>

        <div className="card glass stack" style={{ gap: "0.75rem" }}>
          <div className="stack" style={{ gap: "0.2rem" }}>
            <h2 style={{ margin: 0 }}>Phill AI workspace</h2>
            <p className="muted" style={{ margin: 0 }}>
              Chat with Phill, attach training files, and persist helpful responses without leaving the dashboard.
            </p>
          </div>
          <AiPanelWrapper session={session} />
        </div>
      </section>
    </AuthWall>
  );
}
