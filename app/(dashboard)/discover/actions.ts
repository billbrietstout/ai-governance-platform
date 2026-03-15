"use server";

import { createServerCaller } from "@/lib/trpc/server-caller";

export async function runDiscoveryForAsset(assetId: string) {
  const caller = await createServerCaller();
  const result = await caller.discovery.runDiscoveryForAsset({ assetId });
  return result.data.id;
}
