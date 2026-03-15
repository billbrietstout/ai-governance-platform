"use server";

import { createServerCaller } from "@/lib/trpc/server-caller";

export async function resetOnboarding() {
  const caller = await createServerCaller();
  await caller.onboarding.resetOnboarding();
}
