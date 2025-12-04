import AuthWall from "../../components/AuthWall";
import ThemeToggle from "../../components/ThemeToggle";
import { getSessionOrRedirect, serverFetchWithAuth } from "../../lib/session";
import { formatRelative } from "../../lib/dates";
import AiPanelWrapper from "./AiPanelWrapper";

async function loadDashboardData(session) {
  try {
    const [profileRes, aiStatusRes] = await Promise.all([
      serverFetchWithAuth("/users/me", session),
      serverFetchWithAuth("/ai/status", session),
    ]);
    const profile = profileRes.ok ? await profileRes.json() : null;
    const aiStatus = aiStatusRes.ok ? await aiStatusRes.json() : null;
    return { profile, aiStatus };
  } catch (error) {
    return {
      profile: null,
      aiStatus: null,
      error: error instanceof Error ? error.message : "Unable to load data",
    };
  }
}

export default async function DashboardPage() {
  const session = await getSessionOrRedirect("/dashboard");
  const data = await loadDashboardData(session);
  const aiReady = data.aiStatus?.ok === true;
  const aiChecked = data.aiStatus?.checked_at ? formatRelative(data.aiStatus.checked_at) : null;
  const aiTone = data.aiStatus ? (aiReady ? "ok" : "error") : "idle";
  const aiLabel = data.aiStatus ? (aiReady ? "Ready" : "Needs setup") : "Checking";
  const aiDetail = aiReady
    ? "AI can answer prompts and use training files."
    : data.aiStatus?.detail || "Add OPENAI_API_KEY and AI_MODEL to enable Phill.";

  return (
    <AuthWall session={session} title="Phill AI" description="Your focused hub for chatting with Phill and managing training files.">
      <section className="stack" style={{ gap: "1rem" }}>
        <div className="card glass stack" style={{ gap: "0.75rem" }}>
          <div className="stack" style={{ gap: "0.25rem" }}>
            <h1 style={{ margin: 0 }}>Phill dashboard</h1>
            <p className="muted" style={{ margin: 0 }}>
              Jump straight into the AI workspace, keep training files nearby, and adjust your session controls without extra clutter.
            </p>
          </div>
          <div className="chip-row" style={{ gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
            <div className="pill-row" style={{ gap: "0.35rem", alignItems: "center" }}>
              <span className={`status-chip ${aiTone}`}>{aiLabel}</span>
              {data.aiStatus?.model && <span className="pill pill-outline">{data.aiStatus.model}</span>}
              <span className="tiny muted">{aiDetail}</span>
              {aiChecked && <span className="tiny muted">Checked {aiChecked}</span>}
            </div>
            <div className="chip-row" style={{ gap: "0.4rem", flexWrap: "wrap", marginLeft: "auto" }}>
              <ThemeToggle className="secondary" />
              <a className="secondary" href="#ai">Chat</a>
              <a className="secondary" href="/documents">Training files</a>
              <a className="secondary" href="/account">Account</a>
              {(data.profile?.role === "admin" || data.profile?.role === "founder") && (
                <a className="secondary" href="/admin">
                  Admin workspace
                </a>
              )}
            </div>
          </div>
          <div className="chip-row" style={{ justifyContent: "flex-start", gap: "0.75rem", flexWrap: "wrap" }}>
            <ThemeToggle className="secondary" />
            <a className="secondary" href="/account">Account</a>
            {(data.profile?.role === "admin" || data.profile?.role === "founder") && (
              <a className="secondary" href="/admin">
                Admin workspace
              </a>
            )}
            <a className="secondary" href="/documents">Training files</a>
          </div>
          {data.error && <div className="status-error">{data.error}</div>}
        </div>

        <div id="ai" className="card glass stack" style={{ gap: "0.75rem" }}>
          <div className="stack" style={{ gap: "0.2rem" }}>
            <h2 style={{ margin: 0 }}>Phill AI workspace</h2>
            <p className="muted" style={{ margin: 0 }}>
              Chat with Phill and pull in training files as needed. Everything else lives in the documents or admin areas.
            </p>
          </div>
          <AiPanelWrapper session={session} />
        </div>
      </section>
    </AuthWall>
  );
}
