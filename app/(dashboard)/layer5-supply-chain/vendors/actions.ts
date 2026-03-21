"use server";

import { createServerCaller } from "@/lib/trpc/server-caller";

export async function saveVraResponse(
  vendorId: string,
  questionId: string,
  answer: "YES" | "NO" | "NA" | "PARTIAL" | "UNKNOWN",
  evidenceUrl?: string | null,
  notes?: string | null
) {
  const caller = await createServerCaller();
  return caller.supplyChain.saveVraResponse({
    vendorId,
    questionId,
    answer,
    evidenceUrl: evidenceUrl ?? null,
    notes: notes ?? null
  });
}
