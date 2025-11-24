export default function LoginPage() {
  return (
    <section className="grid" style={{ gap: "1.5rem" }}>
      <div className="stack">
        <div className="badge-list">
          <span className="pill">Authentication</span>
          <span className="pill pill-outline">JWT + refresh</span>
        </div>
        <h1 style={{ margin: 0 }}>Sign in to Phill</h1>
        <p className="muted" style={{ margin: 0 }}>
          Use your company email and password. Token refresh and role-based access control are wired on
          the backend; UI flows will be connected once the endpoints are live in your environment.
        </p>
      </div>

      <div className="card grid" style={{ gap: "1rem" }}>
        <div className="stack">
          <h2 style={{ margin: 0 }}>Credentials</h2>
          <span className="muted tiny">
            The form is a visual stub; hook it to <code>/api/auth/login</code> when ready.
          </span>
        </div>
        <form>
          <label>
            Email
            <input type="email" name="email" placeholder="you@company.com" required />
          </label>
          <label>
            Password
            <input type="password" name="password" placeholder="••••••••" required />
          </label>
          <button type="button">Sign in (stub)</button>
        </form>
        <div className="tiny muted">
          <div className="divider" />
          Need to test tokens? Call the backend directly with curl or Postman and watch the network tab
          while this form is wired up.
        </div>
      </div>
    </section>
  );
}
