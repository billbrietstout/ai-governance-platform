/**
 * Compliance Snapshots – point-in-time compliance records.
 */
import Link from "next/link";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { getOrgTier } from "@/lib/tiers/check-tier";
import { UpgradeGate } from "@/components/tiers/UpgradeGate";
import { SnapshotsClient } from "./SnapshotsClient";

export default async function ComplianceSnapshotsPage() {
  const orgTier = await getOrgTier();
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

      <UpgradeGate
        feature="Compliance Snapshots"
        requiredTier="PRO"
        description="Track compliance scores over time and identify trends across all five CoSAI layers"
        unlockedBy={[
          "Compliance trend charts",
          "Point-in-time snapshot history",
          "Layer-by-layer score tracking"
        ]}
        orgTier={orgTier}
      >
        <SnapshotsClient initialSnapshots={snapshots} />
      </UpgradeGate>
    </main>
  );
}
