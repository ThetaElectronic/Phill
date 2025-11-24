import { getSessionOrRedirect } from "../../lib/session";
import TicketsClient from "./client";

export default async function TicketsPage() {
  const session = await getSessionOrRedirect("/tickets");
  return <TicketsClient session={session} />;
}
