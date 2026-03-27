/**
 * Gap Analysis report – remediation roadmap.
 */
import Link from "next/link";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { SECTION_HEADING_CLASS } from "@/lib/ui/section-heading";

const EXPORT_BTN =
  "rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50";

export default async function GapAnalysisReportPage() {
  const caller = await createServerCaller();
  const { data: gaps } = await caller.dashboard.getTopGaps({ limit: 50 });

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-6 px-6 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/reports" className="text-navy-600 text-sm hover:underline">
            ← Reports
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            Gap Analysis with Remediation Roadmap
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Critical control gaps by asset with suggested ownership and due dates (placeholders until workflow
            ships).
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button type="button" className={EXPORT_BTN}>
            Export PDF
          </button>
          <button type="button" className={EXPORT_BTN}>
            Export CSV
          </button>
        </div>
      </div>

      <div>
        <h2 className={SECTION_HEADING_CLASS}>Critical gaps</h2>
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wide text-slate-500 uppercase">
                  Asset
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wide text-slate-500 uppercase">
                  Control
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wide text-slate-500 uppercase">
                  Layer
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wide text-slate-500 uppercase">
                  Remediation
                </th>
              </tr>
            </thead>
            <tbody>
              {gaps.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                    No critical gaps
                  </td>
                </tr>
              ) : (
                gaps.map((g) => (
                  <tr
                    key={`${g.assetId}-${g.controlId}`}
                    className="border-b border-slate-100 transition last:border-0 hover:bg-slate-50"
                  >
                    <td className="max-w-[min(28rem,40vw)] px-4 py-3 align-top">
                      <Link
                        href={`/layer3-application/assets/${g.assetId}`}
                        className="text-navy-600 font-medium hover:underline"
                      >
                        {g.assetName}
                      </Link>
                      <span className="mt-0.5 block font-mono text-xs text-slate-500">
                        {g.assetId.slice(0, 8)}…
                      </span>
                    </td>
                    <td className="min-w-[12rem] px-4 py-3 text-slate-900">
                      <span className="font-mono text-xs text-slate-500">{g.controlId}</span>
                      <span className="mt-0.5 block">{g.title}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                      {g.cosaiLayer?.replace(/_/g, " ") ?? "—"}
                    </td>
                    <td className="min-w-[10rem] px-4 py-3 text-slate-600">
                      Owner TBD · Due date TBD
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
