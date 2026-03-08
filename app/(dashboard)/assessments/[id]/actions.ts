"use server";

import { revalidatePath } from "next/cache";
import { createServerCaller } from "@/lib/trpc/server-caller";

export async function upsertAttestation(formData: FormData) {
  const assetId = formData.get("assetId") as string;
  const controlId = formData.get("controlId") as string;
  const status = formData.get("status") as "PENDING" | "COMPLIANT" | "NON_COMPLIANT" | "NOT_APPLICABLE";
  const notes = (formData.get("notes") as string) || undefined;

  if (!assetId || !controlId || !status) {
    return { error: "Missing required fields" };
  }

  const caller = await createServerCaller();
  await caller.compliance.upsertAttestation({
    assetId,
    controlId,
    status,
    notes
  });

  revalidatePath("/assessments");
  return null;
}
