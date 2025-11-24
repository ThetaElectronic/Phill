import "./globals.css";

export const metadata = {
  title: "Phill Platform",
  description: "Secure multi-company operations platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="bg-grid gradient-shell">
          <header className="glass">
            <div className="shell brand-row">
              <div className="brand-mark">
                <div className="orb" aria-hidden />
                <div className="stack" style={{ gap: "0.15rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <div className="pill">Phill Platform</div>
                    <span className="muted tiny">2025 rebuild scaffold</span>
                  </div>
                  <div className="muted tiny">
                    FastAPI backend · Next.js 15 frontend · Multi-company isolation
                  </div>
                </div>
              </div>
              <nav className="nav chip-row">
                <a className="chip" href="/login">Login</a>
                <a className="chip" href="/dashboard">Dashboard</a>
                <a className="chip" href="/incidents/create">Incidents</a>
                <a className="chip" href="/documents">Documents</a>
                <a className="chip" href="/ai">Phill AI</a>
                <a className="chip" href="/admin/system">Admin</a>
              </nav>
            </div>
          </header>
          <main className="main-content">
            <div className="shell">{children}</div>
          </main>
          <footer className="footer glass">
            <div className="shell footer-grid">
              <div className="stack" style={{ gap: "0.35rem" }}>
                <strong>Deployment snapshot</strong>
                <span className="muted tiny">
                  Live at app.jarvis-fuel.com · Docker + Nginx · JWT auth · Multi-company isolation
                </span>
              </div>
              <div className="footer-links">
                <a href="/api/health">API health</a>
                <a href="/documents">Storage</a>
                <a href="/ai">AI engine</a>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
