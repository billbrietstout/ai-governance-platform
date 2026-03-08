/**
 * Command Center – executive dashboard.
 */
import Link from "next/link";
import { auth } from "@/auth";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { ComplianceHeatmap } from "./ComplianceHeatmap";
import { RiskMatrix } from "./RiskMatrix";
import { LayerPosturePanel } from "./LayerPosturePanel";
import { AuditFeed } from "./AuditFeed";

const LAYER_LINKS: Record<string, string> = {
  LAYER_1_BUSINESS: "/layer1-business",
  LAYER_3_APPLICATION: "/layer3-application/assets",
  LAYER_5_SUPPLY_CHAIN: "/layer5-supply-chain"
  // LAYER_2_INFORMATION, LAYER_4_PLATFORM: Available via module
};

export default async function CommandCenterPage() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role ?? "MEMBER";
  const caller = await createServerCaller();

  const [
    kpisRes,
    layerRes,
    heatmapRes,
    riskRes,
    cascadeRes,
    gapsRes,
    vendorRes,
    auditRes
  ] = await Promise.all([
    caller.dashboard.getKPIs(),
    caller.dashboard.getLayerPosture(),
    caller.dashboard.getComplianceHeatmap(),
    caller.dashboard.getRiskMatrix(),
    caller.dashboard.getRegulatoryCascadeStatus(),
    caller.dashboard.getTopGaps({ limit: 5 }),
    caller.dashboard.getVendorAssuranceSummary(),
    caller.dashboard.getAuditFeed({ limit: 20 })
  ]);

  let penaltyRes: { data: { totalMin: number; totalMax: number } } | null = null;
  if (role === "CAIO" || role === "ADMIN") {
    try {
      penaltyRes = await caller.dashboard.getEUPenaltyExposure();
    } catch {
      // Ignore if forbidden
    }
  }

  const kpis = kpisRes.data;
  const showFinancial = role === "CAIO" || role === "ADMIN";

  return (
    <main className="flex flex-col gap-6">
      <h2 className="text-2xl font-semibold tracking-tight">Command Center</h2>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        <KpiCard label="Total AI Assets" value={kpis.totalAssets} href="/layer3-application/assets" />
        <KpiCard label="Compliance Score" value={`${kpis.complianceScore}%`} />
        <KpiCard label="Critical Risks" value={kpis.criticalRisks} href="/layer3-application/assets" />
        <KpiCard label="EU High-Risk" value={kpis.euHighRisk} />
        <KpiCard label="No Accountability" value={kpis.withoutAccountability} href="/layer3-application/accountability" />
        <KpiCard label="Stale Cards (>30d)" value={kpis.staleCards} href="/layer5-supply-chain/cards" />
        <KpiCard label="Failed Scan Policies" value={kpis.failedScans} href="/layer5-supply-chain/scanning" />
        <KpiCard label="Vendors Expiring" value={kpis.vendorsExpiring} href="/layer5-supply-chain/vendors" />
      </div>

      {showFinancial && penaltyRes && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
          <h3 className="text-sm font-medium text-amber-400">EU AI Act Penalty Exposure (CAIO view)</h3>
          <p className="mt-1 text-lg font-semibold text-amber-300">
            €{(penaltyRes.data.totalMin / 1_000_000).toFixed(1)}M – €{(penaltyRes.data.totalMax / 1_000_000).toFixed(1)}M
          </p>
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
          <p className="text-2xl font-semibold text-slatePro-100">
            {cascadeRes.data.met} / {cascadeRes.data.totalRequirements} met ({cascadeRes.data.pct}%)
          </p>
          <Link href="/layer1-business/regulatory-cascade" className="mt-2 text-sm text-navy-400 hover:underline">
            View cascade →
          </Link>
        </div>
        <div className="rounded-lg border border-slatePro-700 bg-slatePro-900/30 p-4">
          <h3 className="mb-3 text-sm font-medium text-slatePro-300">Top 5 Critical Gaps</h3>
          <ul className="space-y-1">
            {gapsRes.data.length === 0 ? (
              <li className="text-sm text-slatePro-500">No critical gaps</li>
            ) : (
              gapsRes.data.map((g) => (
                <li key={`${g.assetId}-${g.controlId}`} className="text-sm">
                  <Link href={`/layer3-application/assets/${g.assetId}`} className="text-navy-400 hover:underline">
                    {g.assetName}
                  </Link>
                  <span className="text-slatePro-500"> · {g.controlId} ({g.cosaiLayer ?? "—"})</span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slatePro-700 bg-slatePro-900/30 p-4">
          <h3 className="mb-3 text-sm font-medium text-slatePro-300">Vendor Assurance Summary</h3>
          <div className="space-y-2">
            {vendorRes.data.length === 0 ? (
              <p className="text-sm text-slatePro-500">No vendors</p>
            ) : (
              vendorRes.data.slice(0, 5).map((v) => (
                <div key={v.id} className="flex justify-between text-sm">
                  <Link href={`/layer5-supply-chain/vendors/${v.id}`} className="text-navy-400 hover:underline">
                    {v.name}
                  </Link>
                  <span className={v.expiredCount > 0 ? "text-amber-400" : "text-slatePro-400"}>
                    {Math.round(v.score * 100)}% {v.expiredCount > 0 && `(${v.expiredCount} expired)`}
                  </span>
                </div>
              ))
            )}
          </div>
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
  href
}: {
  label: string;
  value: string | number;
  href?: string;
}) {
  const content = (
    <div className="rounded-lg border border-slatePro-700 bg-slatePro-900/50 p-3">
      <div className="text-xs font-medium text-slatePro-500">{label}</div>
      <div className="mt-1 text-xl font-semibold text-slatePro-100">{value}</div>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}
