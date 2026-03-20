"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/super-admin";
import { setAuth0MfaRequired } from "@/lib/auth0-mgmt";
import { revalidatePath } from "next/cache";

const updateOrgSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  tier: z.enum(["FREE", "PRO", "CONSULTANT", "ENTERPRISE"]).optional(),
  assetLimit: z.number().int().min(0).optional(),
  usersLimit: z.number().int().min(0).optional()
});

export async function updateOrgAction(
  orgId: string,
  data: { name?: string; tier?: string; assetLimit?: number; usersLimit?: number }
) {
  const session = await auth();
  const check = requireSuperAdmin(session);
  if (!check.ok) {
    throw new Error(check.body.error);
  }

  const parsed = updateOrgSchema.parse(data);

  await prisma.organization.update({
    where: { id: orgId },
    data: parsed
  });

  revalidatePath("/super-admin");
  revalidatePath(`/super-admin/orgs/${orgId}`);
}

export async function softDeleteUserAction(userId: string) {
  const session = await auth();
  const check = requireSuperAdmin(session);
  if (!check.ok) {
    throw new Error(check.body.error);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { orgId: true }
  });
  if (!user) throw new Error("User not found");

  await prisma.user.update({
    where: { id: userId },
    data: { deletedAt: new Date() }
  });

  revalidatePath(`/super-admin/orgs/${user.orgId}`);
}

export async function softDeleteOrgAction(orgId: string) {
  const session = await auth();
  const check = requireSuperAdmin(session);
  if (!check.ok) {
    throw new Error(check.body.error);
  }

  await prisma.$transaction([
    prisma.organization.update({
      where: { id: orgId },
      data: { deletedAt: new Date() }
    }),
    prisma.user.updateMany({
      where: { orgId, deletedAt: null },
      data: { deletedAt: new Date() }
    })
  ]);

  revalidatePath("/super-admin");
}

export async function toggleUserMfaAction(userId: string, enabled: boolean) {
  const session = await auth();
  const check = requireSuperAdmin(session);
  if (!check.ok) {
    throw new Error(check.body.error);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, orgId: true }
  });
  if (!user) throw new Error("User not found");

  await prisma.user.update({
    where: { id: userId },
    data: { mfaEnabled: enabled }
  });

  // Sync to Auth0 metadata (fire-and-forget)
  setAuth0MfaRequired(user.email, enabled).catch(() => {});

  revalidatePath(`/super-admin/orgs/${user.orgId}`);
}
