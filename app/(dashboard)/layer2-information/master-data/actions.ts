"use server";

import { createServerCaller } from "@/lib/trpc/server-caller";

export async function updateMasterDataEntity(data: {
  id: string;
  stewardId?: string | null;
  classification?: "PUBLIC" | "INTERNAL" | "CONFIDENTIAL" | "RESTRICTED";
  aiAccessPolicy?: "OPEN" | "GOVERNED" | "RESTRICTED" | "PROHIBITED";
}) {
  const caller = await createServerCaller();
  return caller.layer2.updateMasterDataEntity(data);
}

export async function createMasterDataEntity(data: {
  entityType: "CUSTOMER" | "PRODUCT" | "VENDOR" | "EMPLOYEE" | "FINANCE" | "LOCATION" | "OTHER";
  name: string;
  description?: string;
  stewardId?: string;
  classification?: "PUBLIC" | "INTERNAL" | "CONFIDENTIAL" | "RESTRICTED";
  qualityScore?: number;
  recordCount?: number;
  sourceSystem?: string;
  aiAccessPolicy?: "OPEN" | "GOVERNED" | "RESTRICTED" | "PROHIBITED";
}) {
  const caller = await createServerCaller();
  return caller.layer2.createMasterDataEntity(data);
}
