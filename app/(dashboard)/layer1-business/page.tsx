/**
 * Layer 1 – Business & Governance Layer. Strategy, compliance, and accountability oversight.
 */
import Link from "next/link";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { Layer1VerticalsSummary } from "@/components/layers/Layer1VerticalsSummary";
import { LayerSecurityStandardsCard } from "@/components/layers/LayerSecurityStandardsCard";
import { ExecutiveDashboard } from "./ExecutiveDashboard";

export default async function Layer1BusinessPage() {
  const caller = await createServerCaller();

  const [
    ceoRes,
    cfoRes,
    cooRes,
    cisoRes,
    legalRes,
    portfolioRes,
    recentSnapshotsRes,
    vendorScoresRes
  ] = await Promise.all([
    caller.executiveDashboard.getCEOView(),
    caller.executiveDashboard.getCFOView(),
    caller.executiveDashboard.getCOOView(),
    caller.executiveDashboard.getCISOView(),
    caller.executiveDashboard.getLegalCLOView(),
    caller.executiveDashboard.getVerticalPortfolio(),
    caller.audit.getSnapshots({ limit: 5 }).catch(() => ({ data: [] })),
    caller.supplyChain.getSupplyChainRiskScores().catch(() => ({ data: [] }))
  ]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Business & Governance Layer
            </h1>
            <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
              Layer 1 — Business
            </span>
          </div>
          <p className="mt-1 text-slate-600">
            L1 — Strategy, compliance, and accountability oversight.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Looking for the executive summary? →{" "}
            <Link href="/dashboard/executive" className="text-navy-600 hover:underline">
              View AI Risk Briefing
            </Link>
          </p>
        </div>
        <Link
          href="/layer1-business/regulatory-cascade"
          className="bg-navy-600 hover:bg-navy-500 inline-flex items-center rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-sm transition"
        >
          Regulatory Cascade →
        </Link>
      </div>

      <Layer1VerticalsSummary verticals={portfolioRes.data.verticals} />

      <ExecutiveDashboard
        ceo={ceoRes.data}
        cfo={cfoRes.data}
        coo={cooRes.data}
        ciso={cisoRes.data}
        legal={legalRes.data}
        portfolio={portfolioRes.data}
        recentSnapshots={recentSnapshotsRes.data}
        vendorRiskScores={vendorScoresRes.data}
      />

      <LayerSecurityStandardsCard layer="LAYER_1_BUSINESS" />
    </main>
  );
}
