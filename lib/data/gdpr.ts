/**
 * GDPR – erasure and portability (minimal MVP).
 */

import type { PrismaClient } from "@prisma/client";

/**
 * Anonymize PII for a user. Preserve audit log (anonymize userId reference).
 */
export async function handleErasureRequest(prisma: PrismaClient, userId: string): Promise<void> {
  const anonymized = `anon-${userId.slice(0, 8)}`;

  await prisma.user.update({
    where: { id: userId },
    data: {
      email: `${anonymized}@erased.local`,
      mfaEnabled: false
    }
  });

  // Audit log: keep for compliance, but we don't have a separate audit user ref to anonymize
  // Session cleanup
  await prisma.session.deleteMany({ where: { userId } });
}

/**
 * Export all user data as JSON (portability).
 */
export async function handlePortabilityRequest(prisma: PrismaClient, userId: string): Promise<Record<string, unknown>> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      organization: { select: { name: true, slug: true } },
      ownedAssets: { select: { id: true, name: true, assetType: true } },
      attestations: { select: { id: true, status: true } }
    }
  });

  if (!user) return { error: "User not found" };

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    },
    organization: user.organization,
    ownedAssets: user.ownedAssets,
    attestations: user.attestations,
    exportedAt: new Date().toISOString()
  };
}
