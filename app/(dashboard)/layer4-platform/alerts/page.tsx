/**
 * Alert Engine – Layer 4: Platform
 */
import Link from "next/link";
import { createServerCaller } from "@/lib/trpc/server-caller";

const CATEGORY_LABELS: Record<string, string> = {
  SCAN_POLICY: "Scan Policy",
  CRITICAL_FINDINGS: "Critical Findings",
  GOVERNANCE: "Governance",
  SECURITY: "Security"
};

function SeverityBadge({ severity }: { severity: string }) {
  const colors =
    severity === "CRITICAL"
      ? "bg-red-600 text-white"
      : severity === "HIGH"
        ? "bg-red-100 text-red-700"
        : severity === "MEDIUM"
          ? "bg-amber-100 text-amber-700"
          : "bg-slate-100 text-slate-600";
  return <span className={`rounded px-2 py-0.5 text-xs font-medium ${colors}`}>{severity}</span>;
}

function CategoryBadge({ category }: { category: string }) {
  const colors: Record<string, string> = {
    SCAN_POLICY: "bg-blue-100 text-blue-700",
    CRITICAL_FINDINGS: "bg-orange-100 text-orange-700",
    GOVERNANCE: "bg-purple-100 text-purple-700",
    SECURITY: "bg-red-100 text-red-700"
  };
  return (
    <span
      className={`rounded px-2 py-0.5 text-xs font-medium ${colors[category] ?? "bg-slate-100 text-slate-600"}`}
    >
      {CATEGORY_LABELS[category] ?? category}
    </span>
  );
}

export default async function AlertEnginePage() {
  const caller = await createServerCaller();
  const { data } = await caller.layer4.getAlerts();

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
      <div>
        <Link href="/layer4-platform" className="text-navy-600 text-sm hover:underline">
          ← Layer 4: Platform
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Alert Engine</h1>
        <p className="mt-1 text-slate-600">
          Active alerts across scan policies, critical findings, governance gaps, and security
          events.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 shadow-sm">
          <p className="text-sm font-medium text-red-700">Critical</p>
          <p className="mt-1 text-2xl font-bold text-red-700">{data.bySeverity.CRITICAL}</p>
        </div>
        <div className="rounded-lg border border-red-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-red-600">High</p>
          <p className="mt-1 text-2xl font-bold text-red-600">{data.bySeverity.HIGH}</p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-amber-600">Medium</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{data.bySeverity.MEDIUM}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-slate-600">Total Alerts</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{data.total}</p>
        </div>
      </div>

      {data.alerts.length === 0 ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-center">
          <p className="text-sm font-medium text-emerald-700">No active alerts</p>
          <p className="mt-1 text-xs text-emerald-600">All systems operating normally.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-700">Active Alerts</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {data.alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex flex-col gap-1.5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <SeverityBadge severity={alert.severity} />
                    <CategoryBadge category={alert.category} />
                    <span className="font-medium text-slate-900">{alert.title}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">{alert.detail}</p>
                  {alert.assetName && (
                    <p className="mt-0.5 text-xs text-slate-400">
                      Asset: <span className="font-medium text-slate-600">{alert.assetName}</span>
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-xs text-slate-400">
                  {new Date(alert.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
