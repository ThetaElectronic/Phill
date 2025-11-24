import { redirect } from "next/navigation";

import { getServerSession } from "../lib/session";

export default async function HomePage() {
  const session = getServerSession();
  if (!session?.access_token) {
    redirect("/login");
  }

  redirect("/dashboard");
}
