export default function HomePage() {
  return (
    <section style={{ display: "grid", gap: "1rem" }}>
      <h1>Phill platform scaffold</h1>
      <p>
        The frontend is wired to Next.js 15 with React 19 release candidates. Use the links below to
        navigate to the placeholder pages while API wiring and styling are completed.
      </p>
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <a href="/login">Login</a>
        <a href="/dashboard">Dashboard</a>
        <a href="/incidents/create">Report incident</a>
        <a href="/documents">Documents</a>
        <a href="/ai">Phill AI</a>
        <a href="/admin/system">Admin system</a>
      </div>
    </section>
  );
}
