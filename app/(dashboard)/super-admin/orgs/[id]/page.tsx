import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { assertSuperAdmin } from "@/lib/super-admin";
import { OrgDetailContent } from "./OrgDetailContent";

export default async function SuperAdminOrgDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  await assertSuperAdmin();
  const { id } = await params;

  const org = await prisma.organization.findUnique({
    where: { id },
    include: {
      users: {
        where: { deletedAt: null },
        select: {
          id: true,
          email: true,
          role: true,
          persona: true,
          mfaEnabled: true,
          isSuperAdmin: true,
          createdAt: true
        },
        orderBy: { createdAt: "asc" }
      },
      _count: {
        select: {
          aiAssets: true,
          riskRegisters: true,
          complianceFrameworks: true,
          auditLogs: true
        }
      }
    }
  });

  if (!org) notFound();

  return (
    <OrgDetailContent
      org={{
        id: org.id,
        name: org.name,
        slug: org.slug,
        tier: org.tier,
        assetLimit: org.assetLimit,
        usersLimit: org.usersLimit,
        verticalMarket: org.verticalMarket,
        dataResidency: org.dataResidency,
        onboardingComplete: org.onboardingComplete,
        deletedAt: org.deletedAt,
        createdAt: org.createdAt,
        _count: org._count
      }}
      users={org.users}
    />
  );
}
