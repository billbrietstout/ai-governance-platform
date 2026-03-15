"use server";

import { createServerCaller } from "@/lib/trpc/server-caller";

export async function createLineageRecord(data: {
  name: string;
  description?: string;
  sourceEntityId?: string;
  targetAssetId?: string;
  pipelineType: string;
  transformations?: string;
  refreshFrequency?: string;
  dataClassification?: "PUBLIC" | "INTERNAL" | "CONFIDENTIAL" | "RESTRICTED";
}) {
  const caller = await createServerCaller();
  return caller.layer2.createLineageRecord(data);
}
