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
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
            Gap Analysis with Remediation Roadmap
          </h1>
        </div>
        <div className="flex gap-2">
          <button className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50">
            Export PDF
          </button>
          <button className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50">
            Export CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left font-medium text-gray-900">Asset</th>
              <th className="px-4 py-3 text-left font-medium text-gray-900">Control</th>
              <th className="px-4 py-3 text-left font-medium text-gray-900">Layer</th>
              <th className="px-4 py-3 text-left font-medium text-gray-900">Remediation</th>
            </tr>
          </thead>
          <tbody>
            {gaps.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                  No critical gaps
                </td>
              </tr>
            ) : (
              gaps.map((g) => (
                <tr
                  key={`${g.assetId}-${g.controlId}`}
                  className="border-b border-gray-100 transition last:border-0 hover:bg-gray-50"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/layer3-application/assets/${g.assetId}`}
                      className="text-navy-600 hover:underline"
                    >
                      {g.assetName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-900">
                    {g.controlId}: {g.title}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{g.cosaiLayer ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600">Owner TBD · Due date TBD</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
