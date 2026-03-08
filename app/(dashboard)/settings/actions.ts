"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handlePortabilityRequest } from "@/lib/data/gdpr";

export async function requestDataExport(): Promise<Record<string, unknown>> {
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) throw new Error("Not authenticated");
  return handlePortabilityRequest(prisma, userId);
}
