"use server";

import { auth } from "@/auth";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { revalidatePath } from "next/cache";

export async function createConsultantWorkspaceAction(formData: FormData) {
  const session = await auth();
  const user = session?.user as { id?: string; orgId?: string } | undefined;
  if (!user?.id || !user?.orgId) {
    throw new Error("Unauthorized");
  }

  const clientName = formData.get("clientName") as string;
  const clientContact = formData.get("primaryContactEmail") as string | null;
  const clientVertical = formData.get("clientIndustryVertical") as string | null;
  const assessmentScope = (formData.get("assessmentScope") as "FULL" | "QUICK" | "CUSTOM") || "FULL";

  if (!clientName?.trim()) {
    throw new Error("Client organization name is required");
  }

  const caller = await createServerCaller();
  const result = await caller.consultant.createWorkspace({
    clientName: clientName.trim(),
    clientContact: clientContact?.trim() || undefined,
    clientVertical: clientVertical?.trim() || undefined,
    assessmentScope
  });

  revalidatePath("/consultant");
  revalidatePath("/consultant/new");
  return { clientOrgId: result.clientOrg.id, clientName: result.clientOrg.name };
}
