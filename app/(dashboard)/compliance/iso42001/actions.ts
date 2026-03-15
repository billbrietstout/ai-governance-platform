"use server";

import { createServerCaller } from "@/lib/trpc/server-caller";

export async function updateClauseStatus(input: {
  clauseId: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETE";
  notes?: string;
}) {
  const caller = await createServerCaller();
  await caller.isoReadiness.updateClauseStatus(input);
}
