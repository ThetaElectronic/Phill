export default function LoginPage() {
  return (
    <section>
      <h1>Login</h1>
      <form>
        <label>
          Email
          <input type="email" name="email" required />
        </label>
        <label>
          Password
          <input type="password" name="password" required />
        </label>
        <button type="submit">Sign in</button>
      </form>
    </section>
  );
}
