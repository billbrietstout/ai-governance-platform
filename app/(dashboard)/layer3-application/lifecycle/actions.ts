"use server";

import { createServerCaller } from "@/lib/trpc/server-caller";

export async function promoteLifecycleStage(input: { id: string; notes?: string }) {
  const caller = await createServerCaller();
  const res = await caller.assets.promoteLifecycleStage(input);
  return res.data;
}

export async function demoteLifecycleStage(input: { id: string; notes?: string }) {
  const caller = await createServerCaller();
  const res = await caller.assets.demoteLifecycleStage(input);
  return res.data;
}
