"use server";

import { createServerCaller } from "@/lib/trpc/server-caller";

export async function addProvenanceRecord(input: {
  vendorId: string;
  modelName: string;
  stepType: "TRAINING_DATA" | "BASE_MODEL" | "FINE_TUNING" | "DEPLOYMENT";
  description?: string;
  responsibleParty?: string;
  attestation?: boolean;
  attestationDetails?: string;
  occurredAt?: Date;
}) {
  const caller = await createServerCaller();
  const res = await caller.supplyChain.addProvenanceRecord(input);
  return res.data;
}
