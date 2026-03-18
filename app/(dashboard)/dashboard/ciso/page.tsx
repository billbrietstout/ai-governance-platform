/**
 * Security & Governance Overview – for CISO.
 */
import Link from "next/link";
import { Shield, AlertTriangle, Server, Building } from "lucide-react";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { PersonaDashboardShell } from "@/components/dashboard/PersonaDashboardShell";
import { MaturityRadarChart, type LayerScores } from "@/components/maturity/MaturityRadarChart";

const LAYER_LABELS: Record<string, string> = {
  LAYER_1_BUSINESS: "L1 Business",
  LAYER_2_INFORMATION: "L2 Information",
  LAYER_3_APPLICATION: "L3 Application",
  LAYER_4_PLATFORM: "L4 Platform",
  LAYER_5_SUPPLY_CHAIN: "L5 Supply Chain"
};

function scoreColor(pct: number): string {
  if (pct <= 30) return "bg-red-500";
  if (pct <= 60) return "bg-amber-500";
  if (pct <= 80) return "bg-blue-500";
  return "bg-emerald-500";
}

export default async function CISODashboardPage() {
  const caller = await createServerCaller();

  const [kpisRes, layerRes, maturityRes, gapsRes] = await Promise.all([
    caller.dashboard.getKPIs(),
    caller.dashboard.getLayerPosture(),
    caller.maturity.getMaturityScore(),
    caller.dashboard.getTopGaps({ limit: 5 })
  ]);

  const kpis = kpisRes.data;
  const layers = layerRes.data;
  const maturity = maturityRes.data;
  const gaps = gapsRes.data;

  const openIncidents = 0; // Placeholder
  const failedScans = kpis.failedScans ?? 0;
  const vendorsExpired = kpis.vendorsExpiring ?? 0;

  return (
    <PersonaDashboardShell
      title="Security & Governance Overview"
      subtitle="Layer compliance, security posture, and priority actions."
    >
      <div className="flex flex-col gap-6">
        {/* Section 1 – Security posture */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-medium text-slate-700">Layer compliance scores</h3>
          <div className="space-y-3">
            {layers.map((l) => {
              const label =
                LAYER_LABELS[l.layer] ??
                l.layer.replace("LAYER_", "L").replace("_", " ");
              return (
                <div key={l.layer} className="flex items-center gap-4">
                  <span className="w-24 text-sm text-slate-600">{label}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={`h-full rounded-full ${scoreColor(l.compliancePct)}`}
                      style={{ width: `${l.compliancePct}%` }}
                    />
                  </div>
                  <span className="w-12 text-right text-sm font-medium text-slate-700">
                    {l.compliancePct}%
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <span className="text-sm text-slate-600">Open security incidents: {openIncidents}</span>
            </div>
            <Link
              href="/layer5-supply-chain/scanning"
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-navy-600"
            >
              <Server className="h-5 w-5 text-red-600" />
              Failed scans: {failedScans}
            </Link>
            <Link
              href="/layer5-supply-chain/vendors"
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-navy-600"
            >
              <Building className="h-5 w-5 text-amber-600" />
              Vendors with expired evidence: {vendorsExpired}
            </Link>
          </div>
        </div>

        {/* Section 2 – Radar chart */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-3 text-sm font-medium text-slate-700">
            Current vs target maturity (M3 minimum compliance)
          </h3>
          <div className="flex justify-center">
            <MaturityRadarChart
              scores={maturity.scores as LayerScores}
              targetLevel={3}
              size={280}
              interactive={false}
            />
          </div>
          <p className="mt-2 text-center text-xs text-slate-500">
            Gap to M3 minimum compliance target
          </p>
          <Link
            href="/maturity"
            className="mt-2 block text-center text-sm font-medium text-navy-600 hover:underline"
          >
            View full assessment →
          </Link>
        </div>

        {/* Section 3 – Priority actions */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-medium text-slate-700">Top 5 security gaps</h3>
          {gaps.length === 0 ? (
            <p className="text-sm text-slate-500">No critical security gaps</p>
          ) : (
            <ul className="space-y-2">
              {gaps.map((g) => (
                <li
                  key={`${g.assetId}-${g.controlId}`}
                  className="flex items-center justify-between gap-2 rounded border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <div>
                    <Link
                      href={`/layer3-application/assets/${g.assetId}`}
                      className="font-medium text-navy-600 hover:underline"
                    >
                      {g.assetName}
                    </Link>
                    <span className="ml-2 text-xs text-slate-500">
                      {g.cosaiLayer ?? "—"} • Owner: —
                    </span>
                  </div>
                  <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                    Critical
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/audit-package"
            className="mt-4 inline-block text-sm font-medium text-navy-600 hover:underline"
          >
            View audit package →
          </Link>
        </div>
      </div>
    </PersonaDashboardShell>
  );
}
