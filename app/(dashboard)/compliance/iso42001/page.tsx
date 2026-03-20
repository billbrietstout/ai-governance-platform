/**
 * ISO 42001 Certification Readiness – clause-by-clause checklist.
 */
import Link from "next/link";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { getOrgTier } from "@/lib/tiers/check-tier";
import { UpgradeGate } from "@/components/tiers/UpgradeGate";
import { ISO42001Client } from "./ISO42001Client";
import { ISO_42001_CLAUSES } from "@/lib/iso42001/clauses";

export default async function ISO42001Page() {
  const orgTier = await getOrgTier();
  const caller = await createServerCaller();
  const { data } = await caller.isoReadiness.getReadiness();

  const clauseMap = new Map<string, (typeof data.clauses)[number]>(
    data.clauses.map((c) => [c.clauseId, c])
  );

  return (
    <main className="mx-auto flex min-h-dvh max-w-4xl flex-col gap-8 px-6 py-10">
      <div>
        <Link href="/compliance/snapshots" className="text-navy-600 text-sm hover:underline">
          ← Compliance
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          ISO 42001 Certification Readiness
        </h1>
        <p className="mt-1 text-slate-600">
          Track progress toward ISO/IEC 42001 AI Management System certification.
        </p>
      </div>

      <UpgradeGate
        feature="ISO 42001 Readiness"
        requiredTier="PRO"
        description="Clause-by-clause ISO 42001 compliance checklist with implementation guidance"
        unlockedBy={[
          "140+ clause checklist",
          "Implementation status tracking",
          "Gap identification and remediation"
        ]}
        orgTier={orgTier}
      >
        <ISO42001Client
          initialScore={data.score}
          groups={ISO_42001_CLAUSES.map((g) => ({
            ...g,
            clauses: g.clauses.map((c) => ({
              ...c,
              status: clauseMap.get(c.id)?.status ?? "NOT_STARTED",
              notes: clauseMap.get(c.id)?.notes ?? null
            }))
          }))}
        />
      </UpgradeGate>
    </main>
  );
}
