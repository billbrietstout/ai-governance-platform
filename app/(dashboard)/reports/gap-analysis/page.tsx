/**
 * Gap Analysis report – remediation roadmap.
 */
import Link from "next/link";
import { createServerCaller } from "@/lib/trpc/server-caller";

export default async function GapAnalysisReportPage() {
  const caller = await createServerCaller();
  const { data: gaps } = await caller.dashboard.getTopGaps({ limit: 50 });

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/reports" className="text-navy-400 text-sm hover:underline">
            ← Reports
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Gap Analysis with Remediation Roadmap
          </h1>
        </div>
        <div className="flex gap-2">
          <button className="border-slatePro-600 text-slatePro-300 rounded border px-3 py-1 text-sm">
            Export PDF
          </button>
          <button className="border-slatePro-600 text-slatePro-300 rounded border px-3 py-1 text-sm">
            Export CSV
          </button>
        </div>
      </div>

      <div className="border-slatePro-700 overflow-x-auto rounded-lg border">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-slatePro-700 bg-slatePro-900/50 border-b">
              <th className="text-slatePro-300 px-4 py-2 text-left font-medium">Asset</th>
              <th className="text-slatePro-300 px-4 py-2 text-left font-medium">Control</th>
              <th className="text-slatePro-300 px-4 py-2 text-left font-medium">Layer</th>
              <th className="text-slatePro-300 px-4 py-2 text-left font-medium">Remediation</th>
            </tr>
          </thead>
          <tbody>
            {gaps.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-slatePro-500 px-4 py-8 text-center">
                  No critical gaps
                </td>
              </tr>
            ) : (
              gaps.map((g) => (
                <tr key={`${g.assetId}-${g.controlId}`} className="border-slatePro-800 border-b">
                  <td className="px-4 py-2">
                    <Link
                      href={`/layer3-application/assets/${g.assetId}`}
                      className="text-navy-400 hover:underline"
                    >
                      {g.assetName}
                    </Link>
                  </td>
                  <td className="text-slatePro-200 px-4 py-2">
                    {g.controlId}: {g.title}
                  </td>
                  <td className="text-slatePro-200 px-4 py-2">{g.cosaiLayer ?? "—"}</td>
                  <td className="text-slatePro-400 px-4 py-2">Owner TBD · Due date TBD</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
