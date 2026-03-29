/**
 * Reports – Executive Summary, Compliance Status, Gap Analysis, Maturity Trend.
 */
import Link from "next/link";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { getOrgTier } from "@/lib/tiers/check-tier";
import { UpgradeGate } from "@/components/tiers/UpgradeGate";
import { ReportCardsClient } from "./ReportCardsClient";

export default async function ReportsPage() {
  const orgTier = await getOrgTier();
  const caller = await createServerCaller();
  const [maturityRes, snapshotsRes] = await Promise.all([
    caller.maturity.getMaturityScore(),
    caller.audit.getSnapshots().catch(() => ({ data: [] }))
  ]);

  const maturityLevel = maturityRes.data.maturityLevel;
  const scores = maturityRes.data.scores;
  const snapshots = Array.isArray(snapshotsRes?.data) ? snapshotsRes.data : [];
  const gaps: unknown[] = [];

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-8 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Reports</h1>
        <p className="mt-1 text-sm text-slate-600">
          Generate readiness reports for board presentations and compliance tracking.
        </p>
      </div>

      <UpgradeGate
        feature="Compliance reports"
        requiredTier="PRO"
        description="Generate executive and board-ready readiness reports across all framework layers"
        unlockedBy={[
          "Executive summary reports",
          "Compliance gap analysis",
          "Board presentation exports"
        ]}
        orgTier={orgTier}
      >
        <ReportCardsClient
          maturityLevel={maturityLevel}
          scores={scores}
          snapshots={snapshots}
          gaps={gaps}
        />
      </UpgradeGate>
    </main>
  );
}
