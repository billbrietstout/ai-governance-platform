/**
 * Reports – Executive Summary, Compliance Status, Gap Analysis, Maturity Trend.
 */
import Link from "next/link";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { ReportCardsClient } from "./ReportCardsClient";

export default async function ReportsPage() {
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
        <p className="mt-1 text-slate-600">
          Generate governance reports for board presentations and compliance tracking.
        </p>
      </div>

      <ReportCardsClient
        maturityLevel={maturityLevel}
        scores={scores}
        snapshots={snapshots}
        gaps={gaps}
      />
    </main>
  );
}
