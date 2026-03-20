/**
 * Telemetry & Monitoring – Layer 4: Platform
 */
import Link from "next/link";
import { createServerCaller } from "@/lib/trpc/server-caller";

const SCAN_TYPE_LABELS: Record<string, string> = {
  SBOM: "SBOM",
  SBOM_DEPENDENCY: "SBOM Deps",
  VULN: "Vulnerability",
  SECRETS: "Secrets",
  POLICY: "Policy",
  LICENSE: "License",
  MODEL_SCAN: "Model Scan",
  DATASET_PII: "Dataset PII",
  RED_TEAM: "Red Team"
};

function StatusBadge({ status }: { status: string }) {
  const colors =
    status === "COMPLETED"
      ? "bg-emerald-100 text-emerald-700"
      : status === "FAILED"
        ? "bg-red-100 text-red-700"
        : status === "RUNNING"
          ? "bg-blue-100 text-blue-700"
          : "bg-slate-100 text-slate-600";
  return <span className={`rounded px-2 py-0.5 text-xs font-medium ${colors}`}>{status}</span>;
}

function PolicyBadge({ passed }: { passed: boolean | null }) {
  if (passed === null) return <span className="text-xs text-slate-400">—</span>;
  return passed ? (
    <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
      PASS
    </span>
  ) : (
    <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">FAIL</span>
  );
}

export default async function TelemetryPage() {
  const caller = await createServerCaller();
  const { data } = await caller.layer4.getTelemetry();

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
      <div>
        <Link href="/layer4-platform" className="text-navy-600 text-sm hover:underline">
          ← Layer 4: Platform
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          Telemetry & Monitoring
        </h1>
        <p className="mt-1 text-slate-600">
          Scan activity, coverage, and findings across all AI assets.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Scans", value: data.summary.totalScans },
          { label: "Scans (30d)", value: data.summary.scansLast30d },
          { label: "Total Findings", value: data.summary.totalFindings },
          {
            label: "Critical Findings",
            value: data.summary.criticalFindings,
            alert: data.summary.criticalFindings > 0
          },
          {
            label: "Failed Policies",
            value: data.summary.failedPolicies,
            alert: data.summary.failedPolicies > 0
          },
          { label: "Coverage", value: `${data.summary.coveragePercent}%` },
          {
            label: "Unscanned Assets",
            value: data.summary.unscannedCount,
            alert: data.summary.unscannedCount > 0
          }
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="text-sm font-medium text-slate-600">{card.label}</p>
            <p
              className={`mt-1 text-2xl font-bold ${card.alert ? "text-red-600" : "text-slate-900"}`}
            >
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Scans by Type</h3>
          <div className="space-y-2">
            {Object.entries(data.byType).map(([type, count]) => {
              const max = Math.max(...Object.values(data.byType));
              const pct = Math.round((count / max) * 100);
              return (
                <div key={type} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 text-xs text-slate-600">
                    {SCAN_TYPE_LABELS[type] ?? type}
                  </span>
                  <div className="flex-1 rounded-full bg-slate-100">
                    <div className="bg-navy-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-6 text-right text-xs font-medium text-slate-700">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Scans by Status</h3>
          <div className="space-y-2">
            {Object.entries(data.byStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <StatusBadge status={status} />
                <span className="text-sm font-medium text-slate-700">{count}</span>
              </div>
            ))}
          </div>
          {data.unscannedAssets.length > 0 && (
            <div className="mt-4 border-t border-slate-100 pt-3">
              <p className="mb-2 text-xs font-medium text-slate-600">Unscanned Assets</p>
              <ul className="space-y-1">
                {data.unscannedAssets.map((a) => (
                  <li key={a.id} className="flex items-center justify-between text-xs">
                    <span className="text-slate-700">{a.name}</span>
                    <span className="text-slate-400">{a.assetType}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-700">Recent Scan Activity</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs text-slate-500">
                <th className="px-4 py-2 text-left font-medium">Asset</th>
                <th className="px-4 py-2 text-left font-medium">Type</th>
                <th className="px-4 py-2 text-left font-medium">Scan Type</th>
                <th className="px-4 py-2 text-right font-medium">Findings</th>
                <th className="px-4 py-2 text-right font-medium">Critical</th>
                <th className="px-4 py-2 text-left font-medium">Policy</th>
                <th className="px-4 py-2 text-left font-medium">Status</th>
                <th className="px-4 py-2 text-left font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {data.recentActivity.map((scan) => (
                <tr
                  key={scan.id}
                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50"
                >
                  <td className="px-4 py-2 font-medium text-slate-900">{scan.assetName}</td>
                  <td className="px-4 py-2 text-slate-500">{scan.assetType}</td>
                  <td className="px-4 py-2 text-slate-600">
                    {SCAN_TYPE_LABELS[scan.scanType] ?? scan.scanType}
                  </td>
                  <td className="px-4 py-2 text-right text-slate-700">{scan.findingsCount}</td>
                  <td
                    className={`px-4 py-2 text-right font-medium ${(scan.criticalFindings ?? 0) > 0 ? "text-red-600" : "text-slate-400"}`}
                  >
                    {scan.criticalFindings ?? 0}
                  </td>
                  <td className="px-4 py-2">
                    <PolicyBadge passed={scan.policyPassed ?? null} />
                  </td>
                  <td className="px-4 py-2">
                    <StatusBadge status={scan.status} />
                  </td>
                  <td className="px-4 py-2 text-slate-500">
                    {new Date(scan.startedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
