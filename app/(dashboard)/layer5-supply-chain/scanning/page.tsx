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
        <Link href="/layer5-supply-chain" className="text-sm text-navy-400 hover:underline">
          ← Supply Chain
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Scan Coverage</h1>
        <p className="mt-1 text-slatePro-300">
          Assets × scan types. Red = never run, Yellow = overdue, Green = current.
        </p>
      </div>

      <div className="rounded-lg border border-slatePro-700 bg-slatePro-900/30 p-4">
        <h2 className="mb-2 text-sm font-medium text-slatePro-400">Legend</h2>
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

      <ScanCoverageMatrix
        assets={data.assets}
        scanTypes={data.scanTypes}
      />

      <section>
        <h2 className="mb-2 text-lg font-medium">Policy Compliance by Asset</h2>
        <PolicyComplianceTable />
      </section>

      <div className="rounded-lg border border-slatePro-700 bg-slatePro-900/30 p-4">
        <h2 className="mb-2 text-sm font-medium text-slatePro-400">Webhook</h2>
        <p className="text-sm text-slatePro-300">
          External scanners can push results via <code className="rounded bg-slatePro-800 px-1">POST /api/v1/scans</code> with API key auth.
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
      <p className="rounded-lg border border-slatePro-700 bg-slatePro-900/30 p-4 text-sm text-slatePro-400">
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
    <div className="overflow-x-auto rounded-lg border border-slatePro-700">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-slatePro-700 bg-slatePro-900/50">
            <th className="px-4 py-2 text-left font-medium text-slatePro-300">Asset</th>
            <th className="px-4 py-2 text-left font-medium text-slatePro-300">Score</th>
            <th className="px-4 py-2 text-left font-medium text-slatePro-300">Compliant</th>
            <th className="px-4 py-2 text-left font-medium text-slatePro-300">Passed</th>
            <th className="px-4 py-2 text-left font-medium text-slatePro-300">Missing</th>
            <th className="px-4 py-2 text-left font-medium text-slatePro-300">Overdue</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.assetId} className="border-b border-slatePro-800 last:border-0">
              <td className="px-4 py-2 font-medium text-slatePro-100">{r.assetName}</td>
              <td className="px-4 py-2">{r.compliance.score}%</td>
              <td className="px-4 py-2">
                {r.compliance.compliant ? (
                  <span className="text-emerald-400">Yes</span>
                ) : (
                  <span className="text-amber-400">No</span>
                )}
              </td>
              <td className="px-4 py-2 text-slatePro-300">{r.compliance.passed.join(", ") || "—"}</td>
              <td className="px-4 py-2 text-amber-400">{r.compliance.missing.join(", ") || "—"}</td>
              <td className="px-4 py-2 text-red-400">{r.compliance.overdue.join(", ") || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
