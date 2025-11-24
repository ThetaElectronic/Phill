import AuthWall from "../../components/AuthWall";
import { getSessionOrRedirect } from "../../lib/session";

export default async function SettingsPage() {
  const session = await getSessionOrRedirect("/settings");
  return (
    <AuthWall session={session} title="Settings are protected" description="Sign in to adjust your profile and company preferences.">
      <section className="stack" style={{ gap: "0.75rem" }}>
        <div className="badge-list">
          <span className="pill">Settings</span>
          <span className="pill pill-outline">Account</span>
        </div>
        <h1 style={{ margin: 0 }}>Settings</h1>
        <p className="muted" style={{ margin: 0 }}>
          Profile, notification, and company controls require authentication.
        </p>
        <div className="status-info">Sign in to load and edit settings.</div>
      </section>
    </AuthWall>
  );
}
