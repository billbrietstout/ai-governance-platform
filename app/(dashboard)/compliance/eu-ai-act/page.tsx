/**
 * EU AI Act Conformity – per-asset conformity for high-risk systems.
 */
import Link from "next/link";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { EUAIActClient } from "./EUAIActClient";

const EU_DEADLINE = new Date("2026-08-02");

export default async function EUAIActPage() {
  const caller = await createServerCaller();
  const { data: assets } = await caller.assets.list({});

  const highRiskAssets = assets.filter((a) => a.euRiskLevel === "HIGH");
  const minimalLimited = assets.filter(
    (a) => a.euRiskLevel === "MINIMAL" || a.euRiskLevel === "LIMITED" || !a.euRiskLevel
  );

  const daysUntilDeadline = Math.ceil((EU_DEADLINE.getTime() - Date.now()) / 86400000);

  return (
    <main className="mx-auto flex min-h-dvh max-w-5xl flex-col gap-8 px-6 py-10">
      <div>
        <Link href="/compliance/snapshots" className="text-sm text-navy-600 hover:underline">
          ← Compliance
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          EU AI Act Conformity
        </h1>
        <p className="mt-1 text-slate-600">
          Track conformity assessment readiness for high-risk AI systems.
        </p>
      </div>

      <EUAIActClient
        highRiskAssets={highRiskAssets}
        minimalLimitedCount={minimalLimited.length}
        daysUntilDeadline={daysUntilDeadline}
      />
    </main>
  );
}
