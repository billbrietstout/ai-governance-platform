"use server";

import { redirect } from "next/navigation";
import { createServerCaller } from "@/lib/trpc/server-caller";

export async function importCard(formData: FormData) {
  const assetId = formData.get("assetId") as string | null;
  const source = formData.get("source") as string | null;
  const type = formData.get("type") as "HUGGINGFACE_MODEL" | "HUGGINGFACE_DATASET" | "GITHUB" | null;

  if (!assetId || !source?.trim() || !type) {
    return { error: "Missing asset, source, or type" };
  }

  const caller = await createServerCaller();
  try {
    await caller.supplyChain.importCard({ assetId, source: source.trim(), type });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Import failed";
    return { error: msg };
  }

  redirect("/layer5-supply-chain/cards");
}
