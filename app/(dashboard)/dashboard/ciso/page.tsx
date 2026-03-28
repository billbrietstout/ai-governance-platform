/**
 * Security & oversight overview – for CISO.
 */
import Link from "next/link";
import { Shield, AlertTriangle, Server, Building } from "lucide-react";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { PersonaDashboardShell } from "@/components/dashboard/PersonaDashboardShell";
import { MaturityRadarChart, type LayerScores } from "@/components/maturity/MaturityRadarChart";
import { complianceSurfaceClass, complianceTextClass } from "@/lib/ui/compliance-score";
import { SECTION_HEADING_CLASS } from "@/lib/ui/section-heading";

const LAYER_LABELS: Record<string, string> = {
  LAYER_1_BUSINESS: "L1 Business",
  LAYER_2_INFORMATION: "L2 Information",
  LAYER_3_APPLICATION: "L3 Application",
  LAYER_4_PLATFORM: "L4 Platform",
  LAYER_5_SUPPLY_CHAIN: "L5 Supply Chain"
};

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
      title="Security & oversight overview"
      subtitle="Layer compliance, security posture, and priority actions."
    >
      <div className="flex flex-col gap-6">
        {/* Section 1 – Security posture */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className={SECTION_HEADING_CLASS}>Layer compliance scores</h3>
          <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {layers.map((l) => {
              const label =
                LAYER_LABELS[l.layer] ?? l.layer.replace("LAYER_", "L").replace("_", " ");
              const pct = l.compliancePct;
              return (
                <div
                  key={l.layer}
                  className={`rounded-lg border p-4 text-center ${complianceSurfaceClass(pct)}`}
                >
                  <div className={`text-2xl font-bold ${complianceTextClass(pct)}`}>{pct}%</div>
                  <div className="mt-1 text-xs font-medium text-slate-600">{label}</div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <span className="text-sm text-slate-600">
                Open security incidents: {openIncidents}
              </span>
            </div>
            <Link
              href="/layer5-supply-chain/scanning"
              className="hover:text-navy-600 flex items-center gap-2 text-sm text-slate-600"
            >
              <Server className="h-5 w-5 text-red-600" />
              Failed scans: {failedScans}
            </Link>
            <Link
              href="/layer5-supply-chain/vendors"
              className="hover:text-navy-600 flex items-center gap-2 text-sm text-slate-600"
            >
              <Building className="h-5 w-5 text-amber-600" />
              Vendors with expired evidence: {vendorsExpired}
            </Link>
          </div>
        </div>

        {/* Section 2 – Radar chart */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className={SECTION_HEADING_CLASS}>
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
            className="text-navy-600 mt-2 block text-center text-sm font-medium hover:underline"
          >
            View full assessment →
          </Link>
        </div>

        {/* Section 3 – Priority actions */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className={SECTION_HEADING_CLASS}>Top 5 security gaps</h3>
          {gaps.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center">
              <p className="text-sm text-slate-600">No critical security gaps right now.</p>
              <p className="mt-1 text-xs text-slate-500">
                Keep scanning and attesting controls to maintain posture.
              </p>
              <Link
                href="/layer3-application/gaps"
                className="text-navy-600 mt-3 inline-block text-sm font-medium hover:underline"
              >
                Open gap analysis →
              </Link>
            </div>
          ) : (
            <ul className="space-y-2">
              {gaps.map((g) => (
                <li
                  key={`${g.assetId}-${g.controlId}-${g.title}`}
                  className="flex items-start justify-between gap-3 rounded border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/layer3-application/assets/${g.assetId}`}
                      className="text-navy-600 block text-sm font-medium hover:underline"
                    >
                      {g.controlId}: {g.title}
                    </Link>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      {g.assetName} · {g.cosaiLayer ?? "—"}
                    </span>
                  </div>
                  <span className="shrink-0 rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                    Critical
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/audit-package"
            className="text-navy-600 mt-4 inline-block text-sm font-medium hover:underline"
          >
            View audit package →
          </Link>
        </div>
      </div>
    </PersonaDashboardShell>
  );
}
