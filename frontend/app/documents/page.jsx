import { getSessionOrRedirect } from "../../lib/session";
import DocumentsClient from "./client";

export default async function DocumentsPage() {
  const session = await getSessionOrRedirect("/documents");
  return <DocumentsClient session={session} />;
}
