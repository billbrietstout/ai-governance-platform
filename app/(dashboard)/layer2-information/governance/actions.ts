"use server";

import { createServerCaller } from "@/lib/trpc/server-caller";

export async function createGovernancePolicy(data: {
  name: string;
  policyType: "CLASSIFICATION" | "RETENTION" | "ACCESS" | "QUALITY" | "PRIVACY";
  description: string;
  appliesTo: ("PUBLIC" | "INTERNAL" | "CONFIDENTIAL" | "RESTRICTED")[];
  controls: string[];
  ownerId?: string;
}) {
  const caller = await createServerCaller();
  return caller.layer2.createGovernancePolicy(data);
}

export async function updateGovernancePolicy(data: {
  id: string;
  status?: "DRAFT" | "APPROVED";
  approvedAt?: Date | null;
}) {
  const caller = await createServerCaller();
  return caller.layer2.updateGovernancePolicy(data);
}
