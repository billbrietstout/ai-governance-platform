/**
 * Scan Coverage report – what scanned what.
 */
import Link from "next/link";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { ScanCoverageMatrix } from "@/components/supply-chain/ScanCoverageMatrix";

const EXPORT_BTN =
  "rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50";

export default async function ScanCoverageReportPage() {
  const caller = await createServerCaller();
  const { data } = await caller.supplyChain.getScanCoverage();

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-6 px-6 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/reports" className="text-navy-600 text-sm hover:underline">
            ← Reports
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            Scan Coverage Report
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Which scan types have run against which assets in your inventory.
          </p>
        </div>
        <button type="button" className={EXPORT_BTN}>
          Export CSV
        </button>
      </div>

      <ScanCoverageMatrix assets={data.assets} scanTypes={data.scanTypes} />
    </main>
  );
}
