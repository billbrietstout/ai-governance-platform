/**
 * Layer 5 – Supply Chain – overview.
 * Vendor registry, card library, scan coverage summary.
 */
import Link from "next/link";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { LayerSecurityStandardsCard } from "@/components/layers/LayerSecurityStandardsCard";
import { VendorAssuranceScore } from "@/components/supply-chain/VendorAssuranceScore";
import { ScanCoverageMatrix } from "@/components/supply-chain/ScanCoverageMatrix";
import { complianceTextClass } from "@/lib/ui/compliance-score";
import { SECTION_HEADING_CLASS } from "@/lib/ui/section-heading";
import { PageHeader } from "@/components/layout/PageHeader";

export default async function Layer5SupplyChainPage() {
  const caller = await createServerCaller();
  const { data } = await caller.supplyChain.getOverview();

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-8 px-6 py-10">
      <PageHeader
        title="Layer 5: Supply Chain"
        subtitle="Vendor assurance, artifact cards, and scan coverage."
      />

      <div className="grid min-w-0 gap-6 md:grid-cols-3">
        <Link
          href="/layer5-supply-chain/cards"
          className="hover:border-navy-300 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:bg-slate-50"
        >
          <div className="text-xs font-medium tracking-wide text-slate-500 uppercase">
            Card Library
          </div>
          <div className="data-value mt-1 text-2xl font-semibold text-slate-900">{data.cardCount}</div>
          {data.staleCardCount > 0 && (
            <div className="mt-1 text-xs text-amber-600">{data.staleCardCount} stale</div>
          )}
        </Link>
        <Link
          href="/layer5-supply-chain/vendors"
          className="hover:border-navy-300 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:bg-slate-50"
        >
          <div className="text-xs font-medium tracking-wide text-slate-500 uppercase">Vendors</div>
          <div className="data-value mt-1 text-2xl font-semibold text-slate-900">{data.vendorCount}</div>
        </Link>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium tracking-wide text-slate-500 uppercase">
            Scan Policy Pass
          </div>
          <div
            className={`data-value mt-1 text-2xl font-semibold ${complianceTextClass(data.scanPolicyPassPct)}`}
          >
            {data.scanPolicyPassPct}%
          </div>
        </div>
      </div>

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className={SECTION_HEADING_CLASS}>Scan Coverage</h2>
          <Link
            href="/layer5-supply-chain/scanning"
            className="text-navy-600 text-sm hover:underline"
          >
            View full matrix →
          </Link>
        </div>
        <ScanCoverageMatrix assets={data.coverage.assets} scanTypes={data.coverage.scanTypes} />
      </div>

      <div>
        <h2 className={SECTION_HEADING_CLASS}>Top Vendors</h2>
        <VendorList />
      </div>

      <LayerSecurityStandardsCard layer="LAYER_5_SUPPLY_CHAIN" />
    </main>
  );
}

async function VendorList() {
  const caller = await createServerCaller();
  const { data } = await caller.supplyChain.getVendors();
  const top = data.slice(0, 5);

  if (top.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 p-6 text-center shadow-sm">
        <p className="text-sm text-slate-600">No vendors registered.</p>
        <Link
          href="/layer5-supply-chain/vendors"
          className="text-navy-600 mt-3 inline-block text-sm font-medium hover:underline"
        >
          Add vendors →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {top.map((v) => (
        <Link
          key={v.id}
          href={`/layer5-supply-chain/vendors/${v.id}`}
          className="hover:border-navy-300 flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-2 shadow-sm transition hover:bg-slate-50"
        >
          <span className="min-w-0">
            <span className="block truncate font-medium text-slate-900">{v.vendorName}</span>
            <span className="text-xs text-slate-400">{v.id.slice(0, 10)}…</span>
          </span>
          <VendorAssuranceScore
            total={v.assuranceScore.total}
            breakdown={v.assuranceScore.breakdown}
          />
        </Link>
      ))}
    </div>
  );
}
