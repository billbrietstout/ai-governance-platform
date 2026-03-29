/**
 * Layer 1 – Business & accountability. Strategy, compliance, and oversight.
 */
import Link from "next/link";
import { getLayerMeta } from "@/lib/ui/layer-colors";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { LayerStackContext } from "@/components/layers/LayerStackContext";
import { Layer1VerticalsSummary } from "@/components/layers/Layer1VerticalsSummary";
import { LayerSecurityStandardsCard } from "@/components/layers/LayerSecurityStandardsCard";
import { ExecutiveDashboard } from "./ExecutiveDashboard";

export default async function Layer1BusinessPage() {
  const meta = getLayerMeta("LAYER_1_BUSINESS");
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
      <div className="flex items-start justify-between gap-4">
        <div className="border-l-[3px] pl-4" style={{ borderLeftColor: meta.accentHex }}>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Business & accountability layer
            </h1>
            <span
              className={`rounded-full border px-3 py-1 text-sm font-medium ${meta.bg} ${meta.border} ${meta.text}`}
            >
              Layer {meta.number} — {meta.shortLabel}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            L1 — Strategy, compliance, and accountability oversight.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Looking for the executive summary?{" "}
            <Link href="/dashboard/executive" className="text-navy-600 hover:underline">
              View AI Risk Briefing
            </Link>
          </p>
        </div>
        <Link
          href="/layer1-business/regulatory-cascade"
          className="bg-navy-600 hover:bg-navy-500 shrink-0 inline-flex items-center rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-sm transition"
        >
          Regulatory Cascade
        </Link>
      </div>

      <LayerStackContext activeLayer="LAYER_1_BUSINESS" />

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
