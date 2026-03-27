/**
 * Compliance Summary report – per framework, per CoSAI layer.
 */
import Link from "next/link";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { SECTION_HEADING_CLASS } from "@/lib/ui/section-heading";

const EXPORT_BTN =
  "rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50";

export default async function ComplianceSummaryReportPage() {
  const caller = await createServerCaller();
  const { data: map } = await caller.compliance.getRegulationMap({});

  const rows: { key: string; framework: string; layer: string; count: number }[] = [];
  for (const f of map.frameworks) {
    for (const [layer, controls] of Object.entries(map.byLayer)) {
      const fwControls = controls.filter((c) => c.frameworkCode === f.code);
      if (fwControls.length === 0) continue;
      rows.push({
        key: `${f.id}-${layer}`,
        framework: f.name,
        layer: layer.replace(/_/g, " "),
        count: fwControls.length
      });
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-6 px-6 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/reports" className="text-navy-600 text-sm hover:underline">
            ← Reports
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Compliance Summary</h1>
          <p className="mt-1 text-sm text-slate-600">
            Controls mapped by framework and CoSAI layer from your regulation map.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button type="button" className={EXPORT_BTN}>
            Export PDF
          </button>
          <button type="button" className={EXPORT_BTN}>
            Export JSON
          </button>
          <button type="button" className={EXPORT_BTN}>
            Export CSV
          </button>
        </div>
      </div>

      <div>
        <h2 className={SECTION_HEADING_CLASS}>Framework × layer</h2>
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wide text-slate-500 uppercase">
                  Framework
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wide text-slate-500 uppercase">
                  Layer
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium tracking-wide text-slate-500 uppercase">
                  Controls
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-10 text-center text-slate-500">
                    No mapped controls
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.key} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-900">{r.framework}</td>
                    <td className="px-4 py-3 text-slate-700">{r.layer}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-900">{r.count}</td>
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
