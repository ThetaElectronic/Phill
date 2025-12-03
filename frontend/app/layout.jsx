import "./globals.css";
import NavBar from "../components/NavBar";
import { getServerSession, serverFetchWithAuth } from "../lib/session";

export const metadata = {
  title: "Phill Platform",
  description: "Secure multi-company operations platform",
};

const themeInitScript = `(() => {
  try {
    const stored = localStorage.getItem("phill_theme");
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = stored || (prefersDark ? "dark" : "light");
    const isDark = theme === "dark";
    document.documentElement.classList.toggle("theme-dark", isDark);
    document.body?.classList.toggle("theme-dark", isDark);
    document.documentElement.style.colorScheme = isDark ? "dark" : "light";
  } catch (err) {}
})();`;

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
    { href: "/account", label: "Account" },
  ];
  if (isAdmin) {
    navLinks.push({ href: "/admin", label: "Admin" });
  }
  const userLabel = profile?.name || profile?.email;

  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <div className="bg-grid gradient-shell">
          {isAuthed && <NavBar navLinks={navLinks} userLabel={userLabel} />}
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
