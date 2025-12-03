import "./globals.css";
import SessionIndicator from "../components/SessionIndicator";
import { getServerSession, serverFetchWithAuth } from "../lib/session";

export const metadata = {
  title: "Phill Platform",
  description: "Secure multi-company operations platform",
};

export default async function RootLayout({ children }) {
  const session = getServerSession();
  const isAuthed = Boolean(session?.access_token);

  let profile = null;
  if (isAuthed) {
    try {
      const res = await serverFetchWithAuth("/api/users/me", session);
      if (res.ok) {
        profile = await res.json();
      }
    } catch (err) {
      console.error("Failed to load profile for header nav", err);
    }
  }

  const isAdmin = profile?.role === "admin";

  return (
    <html lang="en">
      <body>
        <div className="bg-grid gradient-shell">
          {isAuthed && (
            <header className="glass">
              <div className="shell brand-row" style={{ justifyContent: "space-between" }}>
                <div className="brand-mark">
                  <div className="orb" aria-hidden />
                  <div className="stack" style={{ gap: "0.15rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div className="pill">Phill</div>
                      <span className="muted tiny">Secure workspace</span>
                    </div>
                    <div className="muted tiny">Fast, minimal, glassy UI</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <nav className="nav chip-row">
                    <a className="chip" href="/dashboard">Dashboard</a>
                    <a className="chip" href="/documents">Documents</a>
                    <a className="chip" href="/ai">Phill AI</a>
                    <a className="chip" href="/account">Account</a>
                    {isAdmin && (
                      <a className="chip" href="/admin">Admin</a>
                    )}
                  </nav>
                  <SessionIndicator />
                </div>
              </div>
            </header>
          )}
          <main className={`main-content ${isAuthed ? "" : "auth-only"}`}>
            <div className="shell auth-shell">{children}</div>
          </main>
          {isAuthed && (
            <footer className="footer glass">
              <div className="shell footer-grid">
                <div className="stack" style={{ gap: "0.35rem" }}>
                  <strong>Deployment snapshot</strong>
                  <span className="muted tiny">Docker + Nginx · JWT auth · Multi-company isolation</span>
                </div>
                <div className="footer-links">
                  <a href="/api/health">API health</a>
                  <a href="/documents">Storage</a>
                  <a href="/ai">AI engine</a>
                </div>
              </div>
            </footer>
          )}
        </div>
      </body>
    </html>
  );
}
