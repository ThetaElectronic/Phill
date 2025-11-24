export default function AIPage() {
  return (
    <section className="grid" style={{ gap: "1.5rem" }}>
      <div className="stack">
        <div className="badge-list">
          <span className="pill">Phill AI</span>
          <span className="pill pill-outline">GPT-5.1</span>
          <span className="pill pill-success">Guardrails</span>
        </div>
        <h1 style={{ margin: 0 }}>Chat assistant</h1>
        <p className="muted" style={{ margin: 0 }}>
          The UI will plug into the FastAPI AI router with hallucination safeguards and optional per-company
          memory. Use this page to validate routing and environment variables.
        </p>
      </div>

      <div className="card stack">
        <h2>How to enable</h2>
        <div className="grid" style={{ gap: "0.75rem" }}>
          <div className="stack">
            <strong>Set API keys</strong>
            <span className="muted tiny">
              Ensure <code>OPENAI_API_KEY</code> and <code>AI_MODEL</code> are present in your environment.
            </span>
          </div>
          <div className="divider" />
          <div className="stack">
            <strong>Connect fetcher</strong>
            <span className="muted tiny">
              Send chat turns to <code>/api/ai/chat</code>; include the bearer token for company isolation.
            </span>
          </div>
          <div className="divider" />
          <div className="stack">
            <strong>Add memory toggle</strong>
            <span className="muted tiny">
              Use the <code>memory</code> flag to persist conversations per company. See the backend router
              for accepted payload shape.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
