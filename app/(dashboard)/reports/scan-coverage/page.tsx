/**
 * Scan Coverage report – what scanned what.
 */
import Link from "next/link";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { ScanCoverageMatrix } from "@/components/supply-chain/ScanCoverageMatrix";

export default async function ScanCoverageReportPage() {
  const caller = await createServerCaller();
  const { data } = await caller.supplyChain.getScanCoverage();

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/reports" className="text-navy-400 text-sm hover:underline">
            ← Reports
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
            Scan Coverage Report
          </h1>
        </div>
        <div className="flex gap-2">
          <button className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50">
            Export CSV
          </button>
        </div>
      </div>

      <ScanCoverageMatrix assets={data.assets} scanTypes={data.scanTypes} />
    </main>
  );
}
