/**
 * Billing & Subscription – upgrade flows and plan management.
 */
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getAssetLimit, getUsersLimit } from "@/lib/tiers/gates";
import { redirect } from "next/navigation";
import { BillingContent } from "./BillingContent";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const session = await auth();
  const user = session?.user as { orgId?: string } | undefined;
  const orgId = user?.orgId;

  if (!orgId) {
    redirect("/login");
  }

  const [org, assetCount, userCount] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: orgId },
      select: {
        tier: true,
        assetLimit: true,
        usersLimit: true,
        trialStartedAt: true,
        trialEndsAt: true
      }
    }),
    prisma.aIAsset.count({ where: { orgId, deletedAt: null } }),
    prisma.user.count({ where: { orgId } })
  ]);

  const tier = org?.tier ?? "FREE";
  const assetLimit = org?.assetLimit ?? getAssetLimit(tier);
  const usersLimit = org?.usersLimit ?? getUsersLimit(tier);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Billing & Subscription
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Manage your plan and upgrade when you need more.
        </p>
      </div>

      <BillingContent
        tier={tier}
        assetCount={assetCount}
        assetLimit={assetLimit}
        userCount={userCount}
        usersLimit={usersLimit}
        trialEndsAt={org?.trialEndsAt ?? null}
      />
    </div>
  );
}
