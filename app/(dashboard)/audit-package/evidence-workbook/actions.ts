"use server";

import { createServerCaller } from "@/lib/trpc/server-caller";

export async function getEvidenceWorkbook(layer?: "L1" | "L2" | "L3" | "L4" | "L5") {
  const caller = await createServerCaller();
  const res = await caller.audit.getEvidenceWorkbook({ layer });
  return res.data;
}

export async function getEvidenceCompleteness() {
  const caller = await createServerCaller();
  const res = await caller.audit.getEvidenceCompleteness();
  return res.data;
}
