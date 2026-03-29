/**
 * Drift Detection – Layer 4: Platform
 */
import Link from "next/link";
import { createServerCaller } from "@/lib/trpc/server-caller";

const SIGNAL_LABELS: Record<string, { label: string; color: string }> = {
  NEVER_SCANNED: { label: "Never Scanned", color: "bg-slate-100 text-slate-600" },
  SCAN_OVERDUE: { label: "Scan Overdue", color: "bg-amber-100 text-amber-700" },
  POLICY_FAILED: { label: "Policy Failed", color: "bg-red-100 text-red-700" },
  FINDINGS_INCREASED: { label: "Findings Increased", color: "bg-orange-100 text-orange-700" },
  HIGH_RISK_STALE: { label: "High Risk Stale", color: "bg-red-100 text-red-700" }
};

function SeverityBadge({ severity }: { severity: string }) {
  const colors =
    severity === "HIGH"
      ? "bg-red-100 text-red-700"
      : severity === "MEDIUM"
        ? "bg-amber-100 text-amber-700"
        : "bg-slate-100 text-slate-600";
  return <span className={`rounded px-2 py-0.5 text-xs font-medium ${colors}`}>{severity}</span>;
}

export default async function DriftDetectionPage() {
  const caller = await createServerCaller();
  const { data } = await caller.layer4.getDrift();

  const flagged = data.driftSignals.filter((d) => d.signals.length > 0);
  const clean = data.driftSignals.filter((d) => d.signals.length === 0);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
      <div>
        <Link href="/layer4-platform" className="text-navy-600 text-sm hover:underline">
          ← Layer 4: Platform
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          Drift Detection
        </h1>
        <p className="mt-1 text-slate-600">
          Monitor AI assets for policy drift — stale scans, policy failures, and rising
          findings.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-slate-600">Total Assets</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{data.summary.totalAssets}</p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 shadow-sm">
          <p className="text-sm font-medium text-red-700">HIGH Severity</p>
          <p className="mt-1 text-2xl font-bold text-red-700">{data.summary.bySeverity.HIGH}</p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <p className="text-sm font-medium text-amber-700">MEDIUM Severity</p>
          <p className="mt-1 text-2xl font-bold text-amber-700">{data.summary.bySeverity.MEDIUM}</p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <p className="text-sm font-medium text-emerald-700">Clean Assets</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">{data.summary.cleanAssets}</p>
        </div>
      </div>

      {flagged.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-700">
              Flagged Assets{" "}
              <span className="ml-1 rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700">
                {flagged.length}
              </span>
            </h3>
          </div>
          <div className="divide-y divide-slate-50">
            {flagged.map((d) => (
              <div
                key={d.assetId}
                className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">{d.assetName}</span>
                    <span className="text-xs text-slate-400">{d.assetType}</span>
                    {d.euRiskLevel === "HIGH" && (
                      <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700">
                        HIGH RISK
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {d.signals.map((signal) => {
                      const meta = SIGNAL_LABELS[signal] ?? {
                        label: signal,
                        color: "bg-slate-100 text-slate-600"
                      };
                      return (
                        <span
                          key={signal}
                          className={`rounded px-1.5 py-0.5 text-xs ${meta.color}`}
                        >
                          {meta.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-4 text-xs text-slate-500">
                  {d.daysSinceScan !== null && <span>{d.daysSinceScan}d since scan</span>}
                  {d.findingsDelta !== null && d.findingsDelta > 0 && (
                    <span className="text-orange-600">+{d.findingsDelta} findings</span>
                  )}
                  <SeverityBadge severity={d.severity} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {clean.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-700">
              Clean Assets{" "}
              <span className="ml-1 rounded bg-emerald-100 px-1.5 py-0.5 text-xs text-emerald-700">
                {clean.length}
              </span>
            </h3>
          </div>
          <div className="divide-y divide-slate-50">
            {clean.map((d) => (
              <div key={d.assetId} className="flex items-center justify-between px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-900">{d.assetName}</span>
                  <span className="text-xs text-slate-400">{d.assetType}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  {d.daysSinceScan !== null && <span>{d.daysSinceScan}d since scan</span>}
                  <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-700">
                    Clean
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
