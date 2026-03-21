/**
 * Shadow AI Detection – Layer 2: Information.
 */
import Link from "next/link";
import { Bot, AlertTriangle, UserX, Shield, ArrowRight } from "lucide-react";
import { createServerCaller } from "@/lib/trpc/server-caller";

const RISK_BADGES: Record<string, string> = {
  MINIMAL: "bg-gray-100 text-gray-700",
  LIMITED: "bg-amber-100 text-amber-700",
  HIGH: "bg-red-100 text-red-700",
  UNACCEPTABLE: "bg-red-200 text-red-800"
};

export default async function ShadowAIDetectionPage() {
  const caller = await createServerCaller();
  const res = await caller.layer2.getShadowAI();
  const { summary, shadowRegistry, coverageByDept, riskExposure } = res.data;

  const deptOrder = ["Operations", "Finance", "HR", "Supply Chain", "Retail", "IT", "Other"];

  return (
    <main className="flex flex-col gap-6">
      <div>
        <Link href="/layer2-information" className="text-navy-400 text-sm hover:underline">
          ← Layer 2: Information
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Shadow AI Detection</h1>
        <p className="mt-1 text-gray-600">Discover and govern ungoverned AI systems.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Bot className="text-navy-500 h-4 w-4" />
            <span className="text-sm font-medium text-slate-600">Ungoverned AI</span>
          </div>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{summary.ungovernedCount}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-medium text-slate-600">DRAFT Status</span>
          </div>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{summary.draftCount}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <UserX className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-slate-600">No Owner</span>
          </div>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{summary.noOwnerCount}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-slate-600">No Compliance Framework</span>
          </div>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{summary.noFrameworkCount}</p>
        </div>
      </div>

      {/* Shadow AI Registry */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-medium text-slate-700">
            Shadow AI Registry — Discovered Ungoverned
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Asset</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  Department
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  Discovery Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">EU Risk</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  Days Ungoverned
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {shadowRegistry.map((a) => (
                <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-medium text-gray-900">{a.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{a.department}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {a.discoveryDate ? new Date(a.discoveryDate).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${RISK_BADGES[a.euRiskLevel ?? "LIMITED"] ?? RISK_BADGES.LIMITED}`}
                    >
                      {a.euRiskLevel ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{a.daysUngoverned}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/layer3-application/assets/${a.id}`}
                      className="bg-navy-600 hover:bg-navy-500 inline-flex items-center gap-1 rounded px-3 py-1.5 text-sm font-medium text-white"
                    >
                      Begin Assessment
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Coverage Gap Analysis */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-medium text-slate-700">Coverage Gap Analysis</h2>
          <div className="space-y-2">
            {deptOrder
              .filter(
                (d) =>
                  coverageByDept[d] &&
                  (coverageByDept[d].governed > 0 || coverageByDept[d].ungoverned > 0)
              )
              .map((dept) => (
                <div
                  key={dept}
                  className="flex items-center justify-between rounded border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <span className="font-medium text-gray-900">{dept}</span>
                  <span className="text-sm text-slate-600">
                    {coverageByDept[dept].governed} governed, {coverageByDept[dept].ungoverned}{" "}
                    ungoverned
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Risk Exposure from Shadow AI */}
        <div className="rounded-lg border border-red-200 bg-red-50/50 p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-medium text-slate-700">Risk Exposure from Shadow AI</h2>
          <div className="space-y-2">
            <p className="text-sm text-slate-600">
              <strong>{riskExposure.highRiskDraftCount}</strong> HIGH euRiskLevel DRAFT assets
            </p>
            <p className="text-sm text-slate-600">
              EU AI Act exposure from ungoverned HIGH risk assets
            </p>
            <p className="mt-2 font-medium text-red-700">{riskExposure.message}</p>
          </div>
        </div>
      </div>
    </main>
  );
}
