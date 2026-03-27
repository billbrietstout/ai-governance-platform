/**
 * Executive Summary – 1-page board-ready.
 */
import Link from "next/link";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { complianceTextClass } from "@/lib/ui/compliance-score";
import { SECTION_HEADING_CLASS } from "@/lib/ui/section-heading";

export default async function ExecutiveSummaryReportPage() {
  const caller = await createServerCaller();
  const [kpisRes, cascadeRes] = await Promise.all([
    caller.dashboard.getKPIs(),
    caller.dashboard.getRegulatoryCascadeStatus()
  ]);
  const kpis = kpisRes.data;
  const cascade = cascadeRes.data;

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 px-6 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/reports" className="text-navy-600 text-sm hover:underline">
            ← Reports
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Executive Summary</h1>
          <p className="mt-1 text-sm text-slate-600">
            One-page board-ready snapshot. Full PDF export coming soon.
          </p>
        </div>
        <button
          type="button"
          className="bg-navy-600 hover:bg-navy-500 shrink-0 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm"
        >
          Export PDF
        </button>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className={SECTION_HEADING_CLASS}>AI Readiness Posture</h2>
        <div className="mt-2 grid grid-cols-2 gap-4">
          <div>
            <span className="text-xs font-medium tracking-wide text-slate-500 uppercase">
              Total AI Assets
            </span>
            <div className="text-xl font-semibold tabular-nums text-slate-900">{kpis.totalAssets}</div>
          </div>
          <div>
            <span className="text-xs font-medium tracking-wide text-slate-500 uppercase">
              Compliance Score
            </span>
            <div className={`text-xl font-semibold tabular-nums ${complianceTextClass(kpis.complianceScore)}`}>
              {kpis.complianceScore}%
            </div>
          </div>
          <div>
            <span className="text-xs font-medium tracking-wide text-slate-500 uppercase">
              Critical Risks
            </span>
            <div className="text-xl font-semibold tabular-nums text-slate-900">{kpis.criticalRisks}</div>
          </div>
          <div>
            <span className="text-xs font-medium tracking-wide text-slate-500 uppercase">
              Regulatory Cascade
            </span>
            <div className={`text-xl font-semibold tabular-nums ${complianceTextClass(cascade.pct)}`}>
              {cascade.pct}% met
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
