/**
 * EU AI Act Conformity – per-asset conformity for high-risk systems.
 */
import Link from "next/link";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { getOrgTier } from "@/lib/tiers/check-tier";
import { UpgradeGate } from "@/components/tiers/UpgradeGate";
import { EUAIActWrapper } from "./EUAIActWrapper";

export default async function EUAIActPage() {
  const orgTier = await getOrgTier();
  const caller = await createServerCaller();
  const { data: assets } = await caller.assets.list({});

  const highRiskAssets = assets
    .filter((a) => a.euRiskLevel === "HIGH")
    .map((a) => ({ id: a.id, name: a.name, euRiskLevel: a.euRiskLevel }));
  const minimalLimitedCount = assets.filter(
    (a) => a.euRiskLevel === "MINIMAL" || a.euRiskLevel === "LIMITED" || !a.euRiskLevel
  ).length;

  const daysUntilDeadline = Math.ceil((new Date("2026-08-02").getTime() - Date.now()) / 86400000);

  return (
    <main className="mx-auto flex min-h-dvh max-w-5xl flex-col gap-8 px-6 py-10">
      <div>
        <Link href="/compliance/snapshots" className="text-navy-600 text-sm hover:underline">
          ← Compliance
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          EU AI Act Conformity
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Track conformity assessment readiness for high-risk AI systems.
        </p>
      </div>

      <UpgradeGate
        feature="EU AI Act Conformity"
        requiredTier="PRO"
        description="Track conformity with EU AI Act requirements including high-risk system obligations"
        unlockedBy={[
          "Risk classification mapping",
          "Conformity deadline tracking",
          "Article-by-article requirements"
        ]}
        orgTier={orgTier}
      >
        <EUAIActWrapper
          highRiskAssets={highRiskAssets}
          minimalLimitedCount={minimalLimitedCount}
          daysUntilDeadline={daysUntilDeadline}
        />
      </UpgradeGate>
    </main>
  );
}
