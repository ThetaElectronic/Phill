import { getSessionOrRedirect } from "../../lib/session";
import AiClient from "./client";

export default async function AiPage() {
  const session = await getSessionOrRedirect("/ai");
  return <AiClient session={session} />;
}
