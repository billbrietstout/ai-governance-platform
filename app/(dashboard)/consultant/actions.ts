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
  const clientIndustryVertical = formData.get("clientIndustryVertical") as string | null;
  const primaryContactEmail = formData.get("primaryContactEmail") as string | null;
  const assessmentScope = (formData.get("assessmentScope") as "FULL" | "QUICK" | "CUSTOM") || "FULL";

  if (!clientName?.trim()) {
    throw new Error("Client organization name is required");
  }

  const caller = await createServerCaller();
  const result = await caller.consultant.createWorkspace({
    clientName: clientName.trim(),
    clientIndustryVertical: clientIndustryVertical?.trim() || undefined,
    primaryContactEmail: primaryContactEmail?.trim() || undefined,
    assessmentScope
  });

  revalidatePath("/consultant");
  revalidatePath("/consultant/new");
  return { clientOrgId: result.clientOrgId };
}

export async function switchWorkspaceAction(targetOrgId: string) {
  const session = await auth();
  const user = session?.user as { id?: string; orgId?: string } | undefined;
  if (!user?.id || !user?.orgId) {
    throw new Error("Unauthorized");
  }

  const caller = await createServerCaller();
  const result = await caller.consultant.switchWorkspace({ targetOrgId });
  revalidatePath("/");
  return { orgId: result.orgId };
}
