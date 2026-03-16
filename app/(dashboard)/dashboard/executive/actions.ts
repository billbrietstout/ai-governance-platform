"use server";

import { createServerCaller } from "@/lib/trpc/server-caller";
import { revalidatePath } from "next/cache";

export async function getUnownedHighRiskAssets() {
  const caller = await createServerCaller();
  const res = await caller.assets.getUnownedHighRiskAssets();
  return res.data;
}

export async function getUnownedAssets() {
  const caller = await createServerCaller();
  const res = await caller.assets.getUnownedAssets();
  return res.data;
}

export async function getOrgUsers() {
  const caller = await createServerCaller();
  const res = await caller.assets.getOrgUsers();
  return res.data;
}

export async function getCaioUser() {
  const caller = await createServerCaller();
  const res = await caller.assets.getOrgUsers();
  const data = res?.data ?? [];
  const caio = Array.isArray(data) ? data.find((u: { role?: string }) => u.role === "CAIO") : null;
  return caio ?? null;
}

export async function getAssignmentSuggestions(assetId: string) {
  const caller = await createServerCaller();
  const res = await caller.assets.getAssignmentSuggestions({ assetId });
  return res.data;
}

export async function assignAccountabilityBulk(
  assignments: Array<{
    assetId: string;
    userId: string;
    suggestionRank?: number;
    suggestionReason?: string;
    wasAutoSuggested?: boolean;
  }>
) {
  const caller = await createServerCaller();
  const res = await caller.accountability.assignBulk(assignments);
  revalidatePath("/dashboard/executive");
  return res.data;
}
