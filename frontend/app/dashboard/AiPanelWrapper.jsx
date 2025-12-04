"use client";

import AiClient from "../ai/client";

export default function AiPanelWrapper({ session }) {
  return <AiClient session={session} />;
}
