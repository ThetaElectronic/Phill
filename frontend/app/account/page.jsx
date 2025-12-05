import AccountClient from "./AccountClient";
import { getSessionOrRedirect, serverFetchWithAuth } from "../../lib/session";

export const metadata = {
  title: "Account",
};

async function loadUser(session) {
  try {
    const res = await serverFetchWithAuth("/users/me", session);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function AccountPage() {
  const session = await getSessionOrRedirect("/account");
  const user = await loadUser(session);

  return <AccountClient session={session} user={user} />;
}
