/**
 * Layer 5 – Supply Chain – overview.
 * Vendor registry, card library, scan coverage summary.
 */
import Link from "next/link";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { VendorAssuranceScore } from "@/components/supply-chain/VendorAssuranceScore";
import { ScanCoverageMatrix } from "@/components/supply-chain/ScanCoverageMatrix";

export default async function Layer5SupplyChainPage() {
  const caller = await createServerCaller();
  const { data } = await caller.supplyChain.getOverview();

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-8 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Layer 5: Supply Chain
        </h1>
        <p className="mt-1 text-gray-600">Vendor assurance, artifact cards, and scan coverage.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Link
          href="/layer5-supply-chain/cards"
          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:border-gray-300 hover:bg-gray-50"
        >
          <div className="text-sm font-medium text-gray-600">Card Library</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">{data.cardCount}</div>
          {data.staleCardCount > 0 && (
            <div className="mt-1 text-xs text-amber-600">{data.staleCardCount} stale</div>
          )}
        </Link>
        <Link
          href="/layer5-supply-chain/vendors"
          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:border-gray-300 hover:bg-gray-50"
        >
          <div className="text-sm font-medium text-gray-600">Vendors</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">{data.vendorCount}</div>
        </Link>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-sm font-medium text-gray-600">Scan Policy Pass</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">{data.scanPolicyPassPct}%</div>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Scan Coverage</h2>
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
        <h2 className="mb-2 text-lg font-medium text-gray-900">Top Vendors</h2>
        <VendorList />
      </div>
    </main>
  );
}

async function VendorList() {
  const caller = await createServerCaller();
  const { data } = await caller.supplyChain.getVendors();
  const top = data.slice(0, 5);

  if (top.length === 0) {
    return (
      <p className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600 shadow-sm">
        No vendors registered.{" "}
        <Link href="/layer5-supply-chain/vendors" className="text-navy-600 hover:underline">
          Add vendors
        </Link>
        .
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {top.map((v) => (
        <Link
          key={v.id}
          href={`/layer5-supply-chain/vendors/${v.id}`}
          className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-2 shadow-sm transition hover:border-gray-300 hover:bg-gray-50"
        >
          <span className="font-medium text-gray-900">{v.vendorName}</span>
          <VendorAssuranceScore
            total={v.assuranceScore.total}
            breakdown={v.assuranceScore.breakdown}
          />
        </Link>
      ))}
    </div>
  );
}
