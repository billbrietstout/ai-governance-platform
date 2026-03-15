"use server";

import { createServerCaller } from "@/lib/trpc/server-caller";

export async function takeSnapshot(input: {
  frameworkCode?: string;
  notes?: string;
  snapshotType?: "MANUAL" | "SCHEDULED" | "PRE_AUDIT";
}) {
  const caller = await createServerCaller();
  const res = await caller.audit.takeSnapshot(input);
  return res.data;
}

export async function compareSnapshots(id1: string, id2: string) {
  const caller = await createServerCaller();
  const res = await caller.audit.compareSnapshots({ id1, id2 });
  return res.data;
}
