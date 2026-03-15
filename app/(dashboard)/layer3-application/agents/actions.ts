"use server";

import { createServerCaller } from "@/lib/trpc/server-caller";

export async function updateAgentConfig(input: {
  id: string;
  overrideTier?: "T1" | "T2" | "T3" | "T4" | "T5" | null;
  toolAuthorizations?: string[];
  oversightPolicy?: string | null;
  humanOversightRequired?: boolean;
}) {
  const caller = await createServerCaller();
  const res = await caller.assets.updateAgentConfig(input);
  return res.data;
}
