/**
 * Scan coverage – assets × scan types matrix.
 * Red=never | Yellow=overdue | Green=current.
 * Policy compliance: % of required scans passing.
 */
import Link from "next/link";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { ScanCoverageMatrix } from "@/components/supply-chain/ScanCoverageMatrix";

export default async function ScanningPage() {
  const caller = await createServerCaller();
  const { data } = await caller.supplyChain.getScanCoverage();

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-6 px-6 py-10">
      <div>
        <Link href="/layer5-supply-chain" className="text-navy-400 text-sm hover:underline">
          ← Supply Chain
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">Scan Coverage</h1>
        <p className="mt-1 text-gray-600">
          Assets × scan types. Red = never run, Yellow = overdue, Green = current.
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-medium text-gray-900">Legend</h2>
        <div className="flex gap-4">
          <span className="flex items-center gap-2">
            <span className="inline-block h-4 w-4 rounded bg-red-500/30" />
            Never / Overdue
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-block h-4 w-4 rounded bg-amber-500/30" />
            Approaching due
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-block h-4 w-4 rounded bg-emerald-500/30" />
            Current & passing
          </span>
        </div>
      </div>

      <ScanCoverageMatrix assets={data.assets} scanTypes={data.scanTypes} />

      <section>
        <h2 className="mb-2 text-lg font-medium text-gray-900">Policy Compliance by Asset</h2>
        <PolicyComplianceTable />
      </section>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-medium text-gray-900">Webhook</h2>
        <p className="text-sm text-gray-700">
          External scanners can push results via{" "}
          <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-gray-800">
            POST /api/v1/scans
          </code>{" "}
          with API key auth.
        </p>
      </div>
    </main>
  );
}

async function PolicyComplianceTable() {
  const caller = await createServerCaller();
  const { data } = await caller.supplyChain.getScanCoverage();

  if (data.assets.length === 0) {
    return (
      <p className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
        No assets. Add assets to see policy compliance.
      </p>
    );
  }

  const rows = await Promise.all(
    data.assets.map(async (row) => {
      const { data: result } = await caller.supplyChain.getScanCompliance({ assetId: row.assetId });
      return { ...row, compliance: result };
    })
  );

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-4 py-3 text-left font-medium text-gray-900">Asset</th>
            <th className="px-4 py-3 text-left font-medium text-gray-900">Score</th>
            <th className="px-4 py-3 text-left font-medium text-gray-900">Compliant</th>
            <th className="px-4 py-3 text-left font-medium text-gray-900">Passed</th>
            <th className="px-4 py-3 text-left font-medium text-gray-900">Missing</th>
            <th className="px-4 py-3 text-left font-medium text-gray-900">Overdue</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.assetId}
              className="border-b border-gray-100 transition last:border-0 hover:bg-gray-50"
            >
              <td className="px-4 py-3 font-medium text-gray-900">{r.assetName}</td>
              <td className="px-4 py-3 text-gray-700">{r.compliance.score}%</td>
              <td className="px-4 py-3">
                {r.compliance.compliant ? (
                  <span className="text-emerald-700">Yes</span>
                ) : (
                  <span className="text-amber-700">No</span>
                )}
              </td>
              <td className="px-4 py-3 text-gray-700">{r.compliance.passed.join(", ") || "—"}</td>
              <td className="px-4 py-3 text-amber-700">{r.compliance.missing.join(", ") || "—"}</td>
              <td className="px-4 py-3 text-red-700">{r.compliance.overdue.join(", ") || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
