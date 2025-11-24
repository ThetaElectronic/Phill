import "./globals.css";

export const metadata = {
  title: "Phill Platform",
  description: "Secure multi-company operations platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header>
          <div className="shell brand-row">
            <div style={{ display: "grid", gap: "0.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <div className="pill">Phill Platform</div>
                <span className="muted tiny">2025 rebuild scaffold</span>
              </div>
              <div className="muted tiny">
                FastAPI backend · Next.js 15 frontend · Multi-company isolation
              </div>
            </div>
            <nav className="nav">
              <a href="/login">Login</a>
              <a href="/dashboard">Dashboard</a>
              <a href="/incidents/create">Incidents</a>
              <a href="/documents">Documents</a>
              <a href="/ai">Phill AI</a>
              <a href="/admin/system">Admin</a>
            </nav>
          </div>
        </header>
        <main className="main-content">
          <div className="shell">{children}</div>
        </main>
      </body>
    </html>
  );
}
