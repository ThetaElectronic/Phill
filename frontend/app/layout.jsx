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
  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/documents", label: "Documents" },
    { href: "/ai", label: "Phill AI" },
    { href: "/account", label: "Account" },
  ];
  if (isAdmin) {
    navLinks.push({ href: "/admin", label: "Admin" });
  }
  const userLabel = profile?.name || profile?.email;

  return (
    <html lang="en">
      <body>
        <div className="bg-grid gradient-shell">
          {isAuthed && (
            <header className="glass">
              <div className="shell brand-row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                <div className="brand-mark" style={{ gap: "0.35rem" }}>
                  <div className="orb" aria-hidden />
                  <div className="stack" style={{ gap: "0.1rem" }}>
                    <div className="pill">Phill</div>
                    <span className="muted tiny">Calm, focused workspace</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <nav className="nav chip-row" aria-label="Primary navigation">
                    {navLinks.map((link) => (
                      <a key={link.href} className="chip" href={link.href}>
                        {link.label}
                      </a>
                    ))}
                  </nav>
                  <div className="stack" style={{ gap: "0.1rem", alignItems: "flex-end" }}>
                    {userLabel && <span className="tiny muted">Signed in as</span>}
                    <SessionIndicator label={userLabel} compact />
                  </div>
                </div>
              </div>
            </header>
          )}
          <main className={`main-content ${isAuthed ? "" : "auth-only"}`}>
            <div className="shell auth-shell">{children}</div>
          </main>
          {isAuthed && (
            <footer className="footer glass">
              <div className="shell footer-grid" style={{ alignItems: "center" }}>
                <div className="stack" style={{ gap: "0.2rem" }}>
                  <strong>All set</strong>
                  <span className="muted tiny">You have access to your company workspace.</span>
                </div>
                <div className="footer-links">
                  <a href="/dashboard">Home</a>
                  <a href="/account">Account</a>
                  {isAdmin && <a href="/admin">Admin</a>}
                </div>
              </div>
            </footer>
          )}
        </div>
      </body>
    </html>
  );
}
