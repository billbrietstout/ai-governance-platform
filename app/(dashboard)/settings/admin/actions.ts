"use server";

import { auth } from "@/auth";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { revalidatePath } from "next/cache";

export async function setOrgTierAction(tier: "FREE" | "PRO" | "CONSULTANT" | "ENTERPRISE") {
  const session = await auth();
  const user = session?.user as { role?: string; orgId?: string } | undefined;
  if (user?.role !== "ADMIN") {
    throw new Error("Forbidden");
  }
  const caller = await createServerCaller();
  await caller.org.setOrgTier({ tier });
  revalidatePath("/settings/admin");
  revalidatePath("/");
}
