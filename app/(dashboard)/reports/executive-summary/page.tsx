/**
 * Executive Summary – 1-page board-ready.
 */
import Link from "next/link";
import { createServerCaller } from "@/lib/trpc/server-caller";

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
      <div className="flex items-center justify-between">
        <div>
          <Link href="/reports" className="text-navy-400 text-sm hover:underline">
            ← Reports
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Executive Summary</h1>
        </div>
        <button className="bg-navy-600 rounded px-3 py-1 text-sm text-white">Export PDF</button>
      </div>

      <div className="border-slatePro-700 bg-slatePro-900/30 rounded-lg border p-6">
        <h2 className="text-slatePro-200 text-lg font-medium">AI Readiness Posture</h2>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <span className="text-slatePro-500">Total AI Assets</span>
            <div className="text-xl font-semibold">{kpis.totalAssets}</div>
          </div>
          <div>
            <span className="text-slatePro-500">Compliance Score</span>
            <div className="text-xl font-semibold">{kpis.complianceScore}%</div>
          </div>
          <div>
            <span className="text-slatePro-500">Critical Risks</span>
            <div className="text-xl font-semibold">{kpis.criticalRisks}</div>
          </div>
          <div>
            <span className="text-slatePro-500">Regulatory Cascade</span>
            <div className="text-xl font-semibold">{cascade.pct}% met</div>
          </div>
        </div>
        <p className="text-slatePro-500 mt-4 text-sm">
          1-page board-ready summary. Full PDF export coming soon.
        </p>
      </div>
    </main>
  );
}
