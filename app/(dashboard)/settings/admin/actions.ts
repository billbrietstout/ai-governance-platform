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

export async function setOrgNotificationsEnabledAction(enabled: boolean) {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  if (user?.role !== "ADMIN") throw new Error("Forbidden");
  const caller = await createServerCaller();
  await caller.notifications.setOrgNotificationsEnabled({ enabled });
  revalidatePath("/settings/admin");
}

export async function sendTestDigestToAllAction() {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  if (user?.role !== "ADMIN") throw new Error("Forbidden");
  const caller = await createServerCaller();
  return caller.notifications.sendTestDigestToAll();
}

export async function setUserEmailEnabledAction(targetUserId: string, enabled: boolean) {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  if (user?.role !== "ADMIN") throw new Error("Forbidden");
  const caller = await createServerCaller();
  await caller.notifications.setUserEmailEnabled({ targetUserId, enabled });
  revalidatePath("/settings/admin");
}
