import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { OrgTier } from "./tier-utils";

export type { OrgTier } from "./tier-utils";

export async function getOrgTier(): Promise<OrgTier> {
  const session = await auth();
  if (!session?.user?.orgId) return "FREE";
  const org = await prisma.organization.findUnique({
    where: { id: (session.user as { orgId?: string }).orgId },
    select: { tier: true }
  });
  return (org?.tier as OrgTier) ?? "FREE";
}

export { tierMeets } from "./tier-utils";
