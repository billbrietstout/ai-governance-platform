/**
 * Command Center – executive dashboard.
 */
import Link from "next/link";
import {
  Bot,
  ShieldCheck,
  AlertOctagon,
  Scale,
  UserX,
  Clock,
  XCircle,
  Building,
  Info
} from "lucide-react";
import { auth } from "@/auth";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { ComplianceHeatmap } from "./ComplianceHeatmap";
import { RiskMatrix } from "./RiskMatrix";
import { LayerPosturePanel } from "./LayerPosturePanel";
import { AuditFeed } from "./AuditFeed";
import { Tooltip } from "@/components/ui/Tooltip";

const LAYER_LINKS: Record<string, string> = {
  LAYER_1_BUSINESS: "/layer1-business",
  LAYER_3_APPLICATION: "/layer3-application/assets",
  LAYER_5_SUPPLY_CHAIN: "/layer5-supply-chain"
};

export default async function CommandCenterPage() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role ?? "MEMBER";
  const caller = await createServerCaller();

  const [
    kpisRes,
    deltasRes,
    layerRes,
    heatmapRes,
    riskRes,
    cascadeRes,
    gapsRes,
    vendorRes,
    auditRes
  ] = await Promise.all([
    caller.dashboard.getKPIs(),
    caller.dashboard.getKPIDeltas(),
    caller.dashboard.getLayerPosture(),
    caller.dashboard.getComplianceHeatmap(),
    caller.dashboard.getRiskMatrix(),
    caller.dashboard.getRegulatoryCascadeStatus(),
    caller.dashboard.getTopGaps({ limit: 5 }),
    caller.dashboard.getVendorAssuranceSummary(),
    caller.dashboard.getAuditFeed({ limit: 20 })
  ]);

  let penaltyRes: { data: { totalMin: number; totalMax: number; byArticle?: unknown[] } } | null = null;
  if (role === "CAIO" || role === "ADMIN") {
    try {
      penaltyRes = await caller.dashboard.getEUPenaltyExposure();
    } catch {
      // Ignore if forbidden
    }
  }

  const kpis = kpisRes.data;
  const deltas = deltasRes.data;
  const showFinancial = role === "CAIO" || role === "ADMIN";
  const systemOk = kpis.criticalRisks === 0;

  return (
    <main className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">Command Center</h2>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            systemOk ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
          }`}
        >
          {systemOk ? "System Operational" : "Issues Detected"}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        <KpiCard
          label="Total AI Assets"
          value={kpis.totalAssets}
          href="/layer3-application/assets"
          icon={<Bot className="h-4 w-4 text-blue-400" />}
          delta={deltas.totalAssetsDelta}
        />
        <KpiCard
          label="Compliance Score"
          value={`${kpis.complianceScore}%`}
          icon={
            <ShieldCheck
              className={`h-4 w-4 ${
                kpis.complianceScore >= 70
                  ? "text-emerald-400"
                  : kpis.complianceScore >= 30
                    ? "text-amber-400"
                    : "text-red-400"
              }`}
            />
          }
        />
        <KpiCard
          label="Critical Risks"
          value={kpis.criticalRisks}
          href="/layer3-application/assets"
          icon={<AlertOctagon className="h-4 w-4 text-red-400" />}
          delta={deltas.criticalRisksDelta}
        />
        <KpiCard
          label="EU High-Risk"
          value={kpis.euHighRisk}
          icon={<Scale className="h-4 w-4 text-amber-400" />}
          tooltip="EU AI Act: classification of AI systems requiring conformity assessment"
        />
        <KpiCard
          label="No Accountability"
          value={kpis.withoutAccountability}
          href="/layer3-application/accountability"
          icon={<UserX className="h-4 w-4 text-red-400" />}
        />
        <KpiCard
          label="Stale Cards (>30d)"
          value={kpis.staleCards}
          href="/layer5-supply-chain/cards"
          icon={<Clock className="h-4 w-4 text-amber-400" />}
        />
        <KpiCard
          label="Failed Scan Policies"
          value={kpis.failedScans}
          href="/layer5-supply-chain/scanning"
          icon={<XCircle className="h-4 w-4 text-red-400" />}
        />
        <KpiCard
          label="Vendors Expiring"
          value={kpis.vendorsExpiring}
          href="/layer5-supply-chain/vendors"
          icon={<Building className="h-4 w-4 text-amber-400" />}
          delta={deltas.vendorsExpiringDelta}
        />
      </div>

      {showFinancial && penaltyRes && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-amber-400">EU AI Act Penalty Exposure (CAIO view)</h3>
            <Tooltip
              content="Range based on high-risk asset count and Article 99 penalty tiers. Min/max reflect potential fines for non-compliance with risk management, data governance, transparency, and human oversight obligations."
            >
              <Info className="h-4 w-4 text-amber-400/80" />
            </Tooltip>
          </div>
          <p className="mt-1 text-lg font-semibold text-amber-300">
            €{(penaltyRes.data.totalMin / 1_000_000).toFixed(1)}M – €{(penaltyRes.data.totalMax / 1_000_000).toFixed(1)}M
          </p>
          <Link
            href="/reports/gap-analysis"
            className="mt-2 inline-block text-sm text-navy-400 hover:underline"
          >
            View breakdown →
          </Link>
        </div>
      )}

      <LayerPosturePanel layers={layerRes.data} layerLinks={LAYER_LINKS} />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slatePro-700 bg-slatePro-900/30 p-4">
          <h3 className="mb-3 text-sm font-medium text-slatePro-300">Compliance Heatmap</h3>
          <ComplianceHeatmap data={heatmapRes.data} />
        </div>
        <div className="rounded-lg border border-slatePro-700 bg-slatePro-900/30 p-4">
          <h3 className="mb-3 text-sm font-medium text-slatePro-300">Risk 5×5 Matrix</h3>
          <RiskMatrix data={riskRes.data} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slatePro-700 bg-slatePro-900/30 p-4">
          <h3 className="mb-3 text-sm font-medium text-slatePro-300">Regulatory Cascade Status</h3>
          <div className="flex items-center gap-4">
            <p className="text-2xl font-semibold text-slatePro-100">
              {cascadeRes.data.met} / {cascadeRes.data.totalRequirements} met
            </p>
            <div className="flex-1">
              <div className="h-2 overflow-hidden rounded-full bg-slatePro-700">
                <div
                  className="h-full rounded-full bg-navy-500 transition-all"
                  style={{ width: `${cascadeRes.data.pct}%` }}
                />
              </div>
            </div>
          </div>
          <Link href="/layer1-business/regulatory-cascade" className="mt-2 text-sm text-navy-400 hover:underline">
            View cascade →
          </Link>
        </div>
        <div className="rounded-lg border border-slatePro-700 bg-slatePro-900/30 p-4">
          <h3 className="mb-3 text-sm font-medium text-slatePro-300">Top 5 Critical Gaps</h3>
          <ul className="space-y-2">
            {gapsRes.data.length === 0 ? (
              <li className="text-sm text-slatePro-500">No critical gaps</li>
            ) : (
              gapsRes.data.map((g) => (
                <li key={`${g.assetId}-${g.controlId}`} className="flex items-center justify-between gap-2 rounded border border-slatePro-700 bg-slatePro-900/50 px-3 py-2">
                  <div>
                    <Link href={`/layer3-application/assets/${g.assetId}`} className="font-medium text-navy-400 hover:underline">
                      {g.assetName}
                    </Link>
                    <span className="ml-2 text-xs text-slatePro-500">{g.controlId} ({g.cosaiLayer ?? "—"})</span>
                  </div>
                  <span className="shrink-0 rounded bg-red-500/20 px-2 py-0.5 text-xs text-red-400">Critical</span>
                  <Link
                    href={`/layer3-application/assets/${g.assetId}`}
                    className="shrink-0 text-xs text-navy-400 hover:underline"
                  >
                    View →
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slatePro-700 bg-slatePro-900/30 p-4">
          <h3 className="mb-3 text-sm font-medium text-slatePro-300">Vendor Assurance Summary</h3>
          <div className="mb-2 flex gap-4 text-xs text-slatePro-400">
            <span>{vendorRes.data.length} vendors</span>
            <span className={vendorRes.data.filter((v) => v.expiredCount > 0).length > 0 ? "text-amber-400" : ""}>
              {vendorRes.data.filter((v) => v.expiredCount > 0).length} with expired evidence
            </span>
          </div>
          <div className="space-y-2">
            {vendorRes.data.length === 0 ? (
              <p className="text-sm text-slatePro-500">No vendors</p>
            ) : (
              vendorRes.data.slice(0, 3).map((v) => (
                <div key={v.id} className="flex items-center justify-between rounded border border-slatePro-700/50 bg-slatePro-900/50 px-3 py-2">
                  <Link href={`/layer5-supply-chain/vendors/${v.id}`} className="font-medium text-navy-400 hover:underline">
                    {v.name}
                  </Link>
                  <span className={`text-sm ${v.expiredCount > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                    {Math.round(v.score * 100)}% {v.expiredCount > 0 && "⚠"}
                  </span>
                </div>
              ))
            )}
          </div>
          <Link href="/layer5-supply-chain/vendors" className="mt-2 text-sm text-navy-400 hover:underline">
            View all vendors →
          </Link>
        </div>
        <div className="rounded-lg border border-slatePro-700 bg-slatePro-900/30 p-4">
          <h3 className="mb-3 text-sm font-medium text-slatePro-300">Recent Audit Activity</h3>
          <AuditFeed entries={auditRes.data} />
        </div>
      </div>
    </main>
  );
}

function KpiCard({
  label,
  value,
  href,
  icon,
  delta,
  tooltip
}: {
  label: string;
  value: string | number;
  href?: string;
  icon?: React.ReactNode;
  delta?: string | null;
  tooltip?: string;
}) {
  const content = (
    <div className="rounded-lg border border-slatePro-700 bg-slatePro-900/50 p-3 transition hover:border-slatePro-600">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium text-slatePro-500">{label}</span>
          {tooltip && (
            <Tooltip content={tooltip}>
              <Info className="h-3 w-3 text-slatePro-500" />
            </Tooltip>
          )}
        </div>
        {icon}
      </div>
      <div className="mt-1 text-xl font-semibold text-slatePro-100">{value}</div>
      {delta && <div className="mt-0.5 text-[10px] text-slatePro-500">{delta}</div>}
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}
