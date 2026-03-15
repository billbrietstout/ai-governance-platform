"use server";

import { createServerCaller } from "@/lib/trpc/server-caller";

export async function generateAuditPackage(input: {
  assetId?: string;
  regulationCode?: string;
}) {
  const caller = await createServerCaller();
  const res = await caller.audit.generateAuditPackage(input);
  return res.data;
}

export async function getAuditPackagePreview(input: {
  assetId?: string;
  regulationCode?: string;
}) {
  const caller = await createServerCaller();
  const res = await caller.audit.getAuditPackagePreview(input);
  return res.data;
}
