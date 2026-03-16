/**
 * Posture Overview – executive dashboard for AI readiness.
 * Redirects to persona dashboard when persona is set, unless view=full.
 */
import { redirect } from "next/navigation";
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
  Info,
  TrendingUp
} from "lucide-react";
import { auth } from "@/auth";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { ComplianceHeatmap } from "../ComplianceHeatmap";
import { RiskMatrix } from "../RiskMatrix";
import { AuditFeed } from "../AuditFeed";
import { LayerSankeyDiagram } from "@/components/dashboard/LayerSankeyDiagram";
import { Tooltip } from "@/components/ui/Tooltip";
import { MaturityRadarChart, type LayerScores } from "@/components/maturity/MaturityRadarChart";

const MATURITY_COLORS: Record<number, string> = {
  1: "#fbbf24",
  2: "#f97316",
  3: "#3b82f6",
  4: "#8b5cf6",
  5: "#10b981"
};

const LAYER_LINKS: Record<string, string> = {
  LAYER_1_BUSINESS: "/layer1-business",
  LAYER_2_INFORMATION: "/layer2-information",
  LAYER_3_APPLICATION: "/layer3-application/assets",
  LAYER_4_PLATFORM: "/layer4-platform",
  LAYER_5_SUPPLY_CHAIN: "/layer5-supply-chain"
};

export default async function CommandCenterPage({
  searchParams
}: {
  searchParams: Promise<{ welcome?: string; view?: string }>;
}) {
  const params = await searchParams;
  const showWelcome = params.welcome === "1";
  const viewFull = params.view === "full";

  const session = await auth();
  const user = session?.user as { role?: string; email?: string | null } | undefined;
  const role = user?.role ?? "MEMBER";
  const displayName = user?.email
    ? user.email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "there";
  const caller = await createServerCaller();

  const [
    personaRes,
    kpisRes,
    deltasRes,
    layerRes,
    sankeyRes,
    heatmapRes,
    riskRes,
    cascadeRes,
    gapsRes,
    vendorRes,
    auditRes,
    maturityRes
  ] = await Promise.all([
    caller.user.getUserPersona(),
    caller.dashboard.getKPIs(),
    caller.dashboard.getKPIDeltas(),
    caller.dashboard.getLayerPosture(),
    caller.dashboard.getSankeyData(),
    caller.dashboard.getComplianceHeatmap(),
    caller.dashboard.getRiskMatrix(),
    caller.dashboard.getRegulatoryCascadeStatus(),
    caller.dashboard.getTopGaps({ limit: 5 }),
    caller.dashboard.getVendorAssuranceSummary(),
    caller.dashboard.getAuditFeed({ limit: 20 }),
    caller.maturity.getMaturityScore()
  ]);

  const persona = personaRes.data.persona;

  // Redirect to persona dashboard when persona is set (unless explicitly viewing full platform)
  if (!viewFull) {
    const { getPersonaDashboardPath } = await import("@/lib/personas/dashboard-routes");
    const personaPath = getPersonaDashboardPath(persona);
    if (personaPath) {
      redirect(personaPath);
    }
    if (!persona) {
      redirect("/persona-select");
    }
  }

  const personaLabel = persona
    ? { CEO: "CEO", CFO: "CFO", COO: "COO", CISO: "CISO", LEGAL: "Legal", CAIO: "CAIO", DATA_OWNER: "Data Owner", DEV_LEAD: "Dev Lead", PLATFORM_ENG: "Platform Engineer", VENDOR_MGR: "Vendor Manager" }[persona] ?? persona
    : null;

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

  const nextSteps = maturityRes.data.nextSteps as { layer: string; action: string; priority: string }[];
  const topNextSteps = nextSteps.slice(0, 3);

  return (
    <main className="flex flex-col gap-6">
      {showWelcome && (
        <div className="rounded-lg border border-navy-200 bg-navy-50 p-4">
          <h3 className="text-lg font-semibold text-navy-900">
            {personaLabel
              ? `Welcome, ${displayName}. As ${personaLabel}, your priority this week is ${topNextSteps[0]?.action ?? "maintaining your governance posture"}.`
              : `Welcome to AI Posture Platform`}
          </h3>
          {!personaLabel && (
            <p className="mt-1 text-navy-700">
              Your baseline readiness score is{" "}
              <span className="font-bold">M{maturityRes.data.maturityLevel}</span>.
              Here&apos;s what to do next:
            </p>
          )}
          {personaLabel && topNextSteps.length > 1 && (
            <p className="mt-2 text-sm text-navy-700">Other priorities:</p>
          )}
          <ul className="mt-3 space-y-2">
            {(personaLabel ? topNextSteps.slice(1) : topNextSteps).map((s, i) => (
              <li key={`${s.layer}-${s.action}`} className="flex items-center gap-2 text-sm text-navy-700">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy-200 text-xs font-medium text-navy-800">
                  {i + 1}
                </span>
                {s.action}
              </li>
            ))}
          </ul>
          {topNextSteps.length === 0 && !personaLabel && (
            <p className="mt-2 text-sm text-navy-600">
              You&apos;re at maximum maturity. Keep up the great work!
            </p>
          )}
        </div>
      )}

      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Posture Overview</h2>
          <p className="mt-0.5 text-sm text-slate-600">
            Your AI readiness posture across the CoSAI five-layer framework
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            systemOk ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
          }`}
        >
          {systemOk ? "System Operational" : "Issues Detected"}
        </span>
      </div>

      <div className="grid gap-3 overflow-visible sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        <KpiCard
          label="Total AI Assets"
          value={kpis.totalAssets}
          href="/layer3-application/assets"
          icon={<Bot className="h-4 w-4 text-blue-600" />}
          delta={deltas.totalAssetsDelta}
        />
        <KpiCard
          label="Compliance Score"
          value={`${kpis.complianceScore}%`}
          icon={
            <ShieldCheck
              className={`h-4 w-4 ${
                kpis.complianceScore >= 70
                  ? "text-emerald-600"
                  : kpis.complianceScore >= 30
                    ? "text-amber-600"
                    : "text-red-600"
              }`}
            />
          }
        />
        <KpiCard
          label="Critical Risks"
          value={kpis.criticalRisks}
          href="/layer3-application/assets"
          icon={<AlertOctagon className="h-4 w-4 text-red-600" />}
          delta={deltas.criticalRisksDelta}
        />
        <KpiCard
          label="EU High-Risk"
          value={kpis.euHighRisk}
          icon={<Scale className="h-4 w-4 text-amber-600" />}
          tooltip="EU AI Act: classification of AI systems requiring conformity assessment"
        />
        <KpiCard
          label="No Accountability"
          value={kpis.withoutAccountability}
          href="/layer3-application/accountability"
          icon={<UserX className="h-4 w-4 text-red-600" />}
        />
        <KpiCard
          label="Stale Cards (>30d)"
          value={kpis.staleCards}
          href="/layer5-supply-chain/cards"
          icon={<Clock className="h-4 w-4 text-amber-600" />}
        />
        <KpiCard
          label="Failed Scan Policies"
          value={kpis.failedScans}
          href="/layer5-supply-chain/scanning"
          icon={<XCircle className="h-4 w-4 text-red-600" />}
        />
        <KpiCard
          label="Vendors Expiring"
          value={kpis.vendorsExpiring}
          href="/layer5-supply-chain/vendors"
          icon={<Building className="h-4 w-4 text-amber-600" />}
          delta={deltas.vendorsExpiringDelta}
        />
        <KpiCard
          label="Maturity Score"
          value={`M${maturityRes.data.maturityLevel}`}
          href="/maturity"
          icon={<TrendingUp className="h-4 w-4" style={{ color: MATURITY_COLORS[maturityRes.data.maturityLevel] ?? "#fbbf24" }} />}
        />
      </div>

      {showFinancial && penaltyRes && (
        <div className="overflow-visible rounded-lg border border-slate-200 border-l-4 border-l-red-600 bg-white shadow-sm">
          <div className="bg-red-50/50 p-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-red-700">EU AI Act Penalty Exposure (CAIO view)</h3>
            <Tooltip
              content="Range based on high-risk asset count and Article 99 penalty tiers. Min/max reflect potential fines for non-compliance with risk management, data governance, transparency, and human oversight obligations."
              side="bottom"
            >
              <Info className="h-4 w-4 text-red-600" />
            </Tooltip>
          </div>
          <p className="mt-1 text-2xl font-bold text-red-600">
            €{(penaltyRes.data.totalMin / 1_000_000).toFixed(1)}M – €{(penaltyRes.data.totalMax / 1_000_000).toFixed(1)}M
          </p>
          <Link
            href="/reports/gap-analysis"
            className="mt-2 inline-block text-sm font-medium text-red-500 hover:text-red-600 hover:underline"
          >
            View breakdown →
          </Link>
          </div>
        </div>
      )}

      {/* Governance dependency flow */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-medium text-slate-700">Governance dependency flow</h3>
        <LayerSankeyDiagram
          layerData={sankeyRes.data.nodes.map((n, i) => {
            const layerKey = [
              "LAYER_1_BUSINESS",
              "LAYER_2_INFORMATION",
              "LAYER_3_APPLICATION",
              "LAYER_4_PLATFORM",
              "LAYER_5_SUPPLY_CHAIN"
            ][i];
            const lp = layerRes.data.find((l) => l.layer === layerKey);
            return { ...n, complianceScore: lp?.compliancePct ?? n.complianceScore };
          })}
          links={sankeyRes.data.links}
          layerLinks={{
            L1: "/layer1-business",
            L2: "/layer2-information",
            L3: "/layer3-application/assets",
            L4: "/layer4-platform",
            L5: "/layer5-supply-chain"
          }}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {layerRes.data.map((l) => {
            const label =
              {
                LAYER_1_BUSINESS: "L1",
                LAYER_2_INFORMATION: "L2",
                LAYER_3_APPLICATION: "L3",
                LAYER_4_PLATFORM: "L4",
                LAYER_5_SUPPLY_CHAIN: "L5"
              }[l.layer] ?? l.layer;
            const href = LAYER_LINKS[l.layer];
            const riskBadge =
              l.riskCount > 0 ? (
                <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-700">{l.riskCount} risks</span>
              ) : (
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">0 risks</span>
              );
            return (
              <Link
                key={l.layer}
                href={href}
                className="flex items-center gap-1.5 rounded border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm transition hover:border-slate-300"
              >
                <span className="font-medium text-slate-700">{label}</span>
                {riskBadge}
                <span className="text-slate-500">{l.compliancePct}%</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Maturity Progress */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-medium text-slate-700">Maturity Progress</h3>
        {!maturityRes.data.lastAssessedAt ? (
          <div className="flex items-center justify-between rounded border border-amber-200 bg-amber-50/50 px-4 py-3">
            <p className="text-sm text-slate-700">No maturity assessment yet.</p>
            <Link
              href="/maturity"
              className="rounded bg-navy-600 px-4 py-2 text-sm font-medium text-white hover:bg-navy-500"
            >
              Complete Assessment
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm text-slate-600" suppressHydrationWarning>
                Last assessed{" "}
                {Math.floor(
                  (Date.now() - new Date(maturityRes.data.lastAssessedAt).getTime()) /
                    (24 * 60 * 60 * 1000)
                )}{" "}
                days ago
              </p>
              <Link href="/maturity" className="text-sm font-medium text-navy-600 hover:underline">
                Retake →
              </Link>
            </div>
            <div className="flex justify-center">
              <MaturityRadarChart
                scores={maturityRes.data.scores as LayerScores}
                targetLevel={Math.min(maturityRes.data.maturityLevel + 1, 5)}
                size={280}
                interactive={false}
              />
            </div>
            <Link
              href="/maturity"
              className="mt-3 block text-center text-sm font-medium text-navy-600 hover:underline"
            >
              View full assessment →
            </Link>
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-medium text-slate-700">Compliance Heatmap</h3>
          <ComplianceHeatmap data={heatmapRes.data} />
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-medium text-slate-700">Risk 5×5 Matrix</h3>
          <RiskMatrix data={riskRes.data} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-medium text-slate-700">Regulatory Cascade Status</h3>
          <div className="flex items-center gap-4">
            <p className="text-2xl font-semibold text-gray-900">
              {cascadeRes.data.met} / {cascadeRes.data.totalRequirements} met
            </p>
            <div className="flex-1">
              <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-navy-500 transition-all"
                  style={{ width: `${cascadeRes.data.pct}%` }}
                />
              </div>
            </div>
          </div>
          <Link href="/layer1-business/regulatory-cascade" className="mt-2 text-sm text-navy-600 hover:underline">
            View cascade →
          </Link>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-medium text-slate-700">Top 5 Critical Gaps</h3>
          <ul className="space-y-2">
            {gapsRes.data.length === 0 ? (
              <li className="text-sm text-slate-500">No critical gaps</li>
            ) : (
              gapsRes.data.map((g) => (
                <li key={`${g.assetId}-${g.controlId}`} className="flex items-center justify-between gap-2 rounded border border-slate-200 bg-slate-50 px-3 py-2">
                  <div>
                    <Link href={`/layer3-application/assets/${g.assetId}`} className="font-medium text-navy-600 hover:underline">
                      {g.assetName}
                    </Link>
                    <span className="ml-2 text-xs text-slate-500">{g.controlId} ({g.cosaiLayer ?? "—"})</span>
                  </div>
                  <span className="shrink-0 rounded bg-red-100 px-2 py-0.5 text-xs text-red-700">Critical</span>
                  <Link
                    href={`/layer3-application/assets/${g.assetId}`}
                    className="shrink-0 text-xs text-navy-600 hover:underline"
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
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-medium text-slate-700">Vendor Assurance Summary</h3>
          <div className="mb-2 flex gap-4 text-xs text-slate-600">
            <span>{vendorRes.data.length} vendors</span>
            <span className={vendorRes.data.filter((v) => v.expiredCount > 0).length > 0 ? "text-amber-600" : ""}>
              {vendorRes.data.filter((v) => v.expiredCount > 0).length} with expired evidence
            </span>
          </div>
          <div className="space-y-2">
            {vendorRes.data.length === 0 ? (
              <p className="text-sm text-gray-500">No vendors</p>
            ) : (
              vendorRes.data.slice(0, 3).map((v) => (
                <div key={v.id} className="flex items-center justify-between rounded border border-slate-200 bg-slate-50 px-3 py-2">
                  <Link href={`/layer5-supply-chain/vendors/${v.id}`} className="font-medium text-navy-600 hover:underline">
                    {v.name}
                  </Link>
                  <span className={`text-sm ${v.expiredCount > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                    {Math.round(v.score * 100)}% {v.expiredCount > 0 && "⚠"}
                  </span>
                </div>
              ))
            )}
          </div>
          <Link href="/layer5-supply-chain/vendors" className="mt-2 text-sm text-navy-600 hover:underline">
            View all vendors →
          </Link>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-medium text-slate-700">Recent Audit Activity</h3>
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
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:border-slate-300 hover:shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium text-slate-500">{label}</span>
          {tooltip && (
            <Tooltip content={tooltip}>
              <Info className="h-3 w-3 text-slate-400" />
            </Tooltip>
          )}
        </div>
        {icon}
      </div>
      <div className="mt-1 text-xl font-semibold text-slate-900">{value}</div>
      {delta && <div className="mt-0.5 text-[10px] text-slate-500">{delta}</div>}
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}
