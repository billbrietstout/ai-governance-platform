import { prisma } from "@/lib/prisma";
import { assertSuperAdmin } from "@/lib/super-admin";
import { SuperAdminOrgList } from "./SuperAdminOrgList";

export default async function SuperAdminPage() {
  await assertSuperAdmin();

  const [orgs, deletedOrgCount] = await Promise.all([
    prisma.organization.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        slug: true,
        tier: true,
        verticalMarket: true,
        createdAt: true,
        _count: {
          select: {
            users: { where: { deletedAt: null } },
            aiAssets: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.organization.count({ where: { deletedAt: { not: null } } })
  ]);

  return <SuperAdminOrgList orgs={orgs} deletedOrgCount={deletedOrgCount} />;
}
