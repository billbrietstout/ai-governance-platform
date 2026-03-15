/**
 * Compliance Snapshots – point-in-time compliance records.
 */
import Link from "next/link";
import { auth } from "@/auth";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { prisma } from "@/lib/prisma";
import { UpgradeGate } from "@/components/tiers/UpgradeGate";
import { SnapshotsClient } from "./SnapshotsClient";

export default async function ComplianceSnapshotsPage() {
  const session = await auth();
  const orgId = (session?.user as { orgId?: string })?.orgId;
  const org = orgId
    ? await prisma.organization.findUnique({
        where: { id: orgId },
        select: { tier: true }
      })
    : null;
  const tier = org?.tier ?? "FREE";

  const caller = await createServerCaller();
  const { data: snapshots } = await caller.audit.getSnapshots();

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-8 px-6 py-10">
      <div>
        <Link href="/dashboard" className="text-sm text-navy-600 hover:underline">
          ← Posture Overview
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          Compliance Snapshots
        </h1>
        <p className="mt-1 text-slate-600">
          Point-in-time compliance records for audit trail and trend analysis.
        </p>
      </div>

      <UpgradeGate feature="compliance_snapshots" tier="PRO" userTier={tier}>
        <SnapshotsClient initialSnapshots={snapshots} />
      </UpgradeGate>
    </main>
  );
}
