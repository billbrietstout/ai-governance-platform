/**
 * Posture Overview – executive dashboard for AI readiness.
 * Performance optimizations:
 * 1. Persona fast-path — redirect before firing any heavy queries
 * 2. unstable_cache on heavy aggregations (5-min TTL)
 * 3. Suspense streaming — page renders instantly, data streams in
 */
import { Suspense } from "react";
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
import { prisma } from "@/lib/prisma";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { ComplianceHeatmap } from "../ComplianceHeatmap";
import { RiskMatrix } from "../RiskMatrix";
import { AuditFeed } from "../AuditFeed";
import { LayerSankeyDiagram } from "@/components/dashboard/LayerSankeyDiagram";
import { Tooltip } from "@/components/ui/Tooltip";
import { MaturityRadarChart, type LayerScores } from "@/components/maturity/MaturityRadarChart";
import { PersonaShortcutBanner } from "@/components/dashboard/PersonaShortcutBanner";
import {
  getCachedKPIs,
  getCachedLayerPosture,
  getCachedSankey,
  getCachedHeatmap,
  getCachedRiskMatrix,
  getCachedMaturity
} from "@/lib/dashboard/cached-queries";
import { complianceBarBgClass, complianceTextClass } from "@/lib/ui/compliance-score";

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

/** Section / card title — uppercase label per design scale */
const SECTION_HEADING = "mb-3 text-xs font-medium uppercase tracking-wide text-slate-500";

// ─── Skeleton components ──────────────────────────────────────────────────────

function KpiSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-2 h-3 w-24 rounded bg-slate-200" />
      <div className="h-6 w-12 rounded bg-slate-200" />
    </div>
  );
}

function CardSkeleton({ height = "h-48" }: { height?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg border border-slate-200 bg-white p-4 shadow-sm ${height}`}
    >
      <div className="mb-4 h-3 w-32 rounded bg-slate-200" />
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-slate-200" />
        <div className="h-3 w-3/4 rounded bg-slate-200" />
        <div className="h-3 w-1/2 rounded bg-slate-200" />
      </div>
    </div>
  );
}

// ─── Async streaming components ───────────────────────────────────────────────

async function KpiCards({ orgId }: { orgId: string }) {
  const caller = await createServerCaller();
  const [kpisRes, deltasRes] = await Promise.all([
    getCachedKPIs(orgId),
    caller.dashboard.getKPIDeltas()
  ]);
  const kpis = kpisRes.data;
  const deltas = deltasRes.data;

  return (
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
          <ShieldCheck className={`h-4 w-4 ${complianceTextClass(kpis.complianceScore)}`} />
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
    </div>
  );
}

async function SankeySection({ orgId }: { orgId: string }) {
  const [sankeyRes, layerRes] = await Promise.all([
    getCachedSankey(orgId),
    getCachedLayerPosture(orgId)
  ]);
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className={SECTION_HEADING}>Governance dependency flow</h3>
      <div className="overflow-x-auto pb-1">
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
      </div>
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
          return (
            <Link
              key={l.layer}
              href={href}
              className="flex items-center gap-1.5 rounded border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm transition hover:border-slate-300"
            >
              <span className="font-medium text-slate-700">{label}</span>
              {l.riskCount > 0 ? (
                <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-700">
                  {l.riskCount} risks
                </span>
              ) : (
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                  0 risks
                </span>
              )}
              <span className={`font-medium ${complianceTextClass(l.compliancePct)}`}>
                {l.compliancePct}%
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

async function MaturitySection({ orgId }: { orgId: string }) {
  const maturityRes = await getCachedMaturity(orgId);
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className={SECTION_HEADING}>Maturity Progress</h3>
      {!maturityRes.data.lastAssessedAt ? (
        <div className="flex items-center justify-between rounded border border-amber-200 bg-amber-50/50 px-4 py-3">
          <p className="text-sm text-slate-700">No maturity assessment yet.</p>
          <Link
            href="/maturity"
            className="bg-navy-600 hover:bg-navy-500 rounded px-4 py-2 text-sm font-medium text-white"
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
            <Link href="/maturity" className="text-navy-600 text-sm font-medium hover:underline">
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
            className="text-navy-600 mt-3 block text-center text-sm font-medium hover:underline"
          >
            View full assessment →
          </Link>
        </>
      )}
    </div>
  );
}

async function HeatmapAndRisk({ orgId }: { orgId: string }) {
  const [heatmapRes, riskRes] = await Promise.all([
    getCachedHeatmap(orgId),
    getCachedRiskMatrix(orgId)
  ]);
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className={SECTION_HEADING}>Compliance Heatmap</h3>
        <ComplianceHeatmap data={heatmapRes.data} />
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className={SECTION_HEADING}>Risk 5×5 Matrix</h3>
        <RiskMatrix data={riskRes.data} />
      </div>
    </div>
  );
}

async function BottomPanels() {
  const caller = await createServerCaller();
  const [cascadeRes, gapsRes, vendorRes, auditRes] = await Promise.all([
    caller.dashboard.getRegulatoryCascadeStatus(),
    caller.dashboard.getTopGaps({ limit: 5 }),
    caller.dashboard.getVendorAssuranceSummary(),
    caller.dashboard.getAuditFeed({ limit: 20 })
  ]);
  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className={SECTION_HEADING}>Regulatory Cascade Status</h3>
          <div className="flex items-center gap-4">
            <p className="text-2xl font-semibold text-gray-900">
              {cascadeRes.data.met} / {cascadeRes.data.totalRequirements} met
            </p>
            <div className="flex-1">
              <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`h-full rounded-full transition-all ${complianceBarBgClass(cascadeRes.data.pct)}`}
                  style={{ width: `${cascadeRes.data.pct}%` }}
                />
              </div>
            </div>
          </div>
          <Link
            href="/layer1-business/regulatory-cascade"
            className="text-navy-600 mt-2 text-sm hover:underline"
          >
            View cascade →
          </Link>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className={SECTION_HEADING}>Top 5 Critical Gaps</h3>
          <ul className="space-y-2">
            {gapsRes.data.length === 0 ? (
              <li className="text-sm text-slate-500">No critical gaps</li>
            ) : (
              gapsRes.data.map((g) => (
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
                  <span className="shrink-0 rounded bg-red-100 px-2 py-0.5 text-xs text-red-700">
                    Critical
                  </span>
                  <Link
                    href={`/layer3-application/assets/${g.assetId}`}
                    className="text-navy-600 shrink-0 text-xs hover:underline"
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
          <h3 className={SECTION_HEADING}>Vendor Assurance Summary</h3>
          <div className="mb-2 flex gap-4 text-xs text-slate-600">
            <span>{vendorRes.data.length} vendors</span>
            <span
              className={
                vendorRes.data.filter((v) => v.expiredCount > 0).length > 0 ? "text-amber-600" : ""
              }
            >
              {vendorRes.data.filter((v) => v.expiredCount > 0).length} with expired evidence
            </span>
          </div>
          <div className="space-y-2">
            {vendorRes.data.length === 0 ? (
              <p className="text-sm text-gray-500">No vendors</p>
            ) : (
              vendorRes.data.slice(0, 3).map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between rounded border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <Link
                    href={`/layer5-supply-chain/vendors/${v.id}`}
                    className="text-navy-600 font-medium hover:underline"
                  >
                    {v.name}
                  </Link>
                  <span className="flex items-center gap-1">
                    <span
                      className={`text-sm font-medium ${complianceTextClass(Math.round(v.score * 100))}`}
                    >
                      {Math.round(v.score * 100)}%
                    </span>
                    {v.expiredCount > 0 && (
                      <span className="text-amber-600" title="Expired evidence">
                        ⚠
                      </span>
                    )}
                  </span>
                </div>
              ))
            )}
          </div>
          <Link
            href="/layer5-supply-chain/vendors"
            className="text-navy-600 mt-2 text-sm hover:underline"
          >
            View all vendors →
          </Link>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className={SECTION_HEADING}>Recent Audit Activity</h3>
          <AuditFeed entries={auditRes.data} />
        </div>
      </div>
    </>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default async function CommandCenterPage({
  searchParams
}: {
  searchParams: Promise<{ welcome?: string; view?: string }>;
}) {
  const params = await searchParams;
  const showWelcome = params.welcome === "1";
  const viewFull = params.view === "full";

  const session = await auth();
  const user = session?.user as
    | { id?: string; role?: string; email?: string | null; orgId?: string }
    | undefined;
  const role = user?.role ?? "MEMBER";
  const orgId = user?.orgId ?? "";

  // ── PHASE 3: Persona fast-path ──
  // Only fetch persona (1 tiny query) before deciding to redirect.
  // Heavy dashboard queries are skipped entirely for persona users.
  if (!viewFull) {
    const dbUser = await prisma.user.findUnique({
      where: { id: user?.id ?? "" },
      select: { persona: true }
    });
    const persona = dbUser?.persona;

    if (!persona) redirect("/persona-select");

    const { getPersonaDashboardPath } = await import("@/lib/personas/dashboard-routes");
    const personaPath = getPersonaDashboardPath(persona);
    if (personaPath) redirect(personaPath);
  }

  // ── Full dashboard (view=full or no persona path) ──
  const caller = await createServerCaller();
  const [personaRes, maturityForWelcome] = await Promise.all([
    caller.user.getUserPersona(),
    getCachedMaturity(orgId)
  ]);

  const persona = personaRes.data.persona;
  const displayName = user?.email
    ? user.email
        .split("@")[0]
        .replace(/[._]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
    : "there";
  const personaLabel = persona
    ? ({
        CEO: "CEO",
        CFO: "CFO",
        COO: "COO",
        CISO: "CISO",
        LEGAL: "Legal",
        CAIO: "CAIO",
        DATA_OWNER: "Data Owner",
        DEV_LEAD: "Dev Lead",
        PLATFORM_ENG: "Platform Engineer",
        VENDOR_MGR: "Vendor Manager"
      }[persona] ?? persona)
    : null;

  const nextSteps = maturityForWelcome.data.nextSteps as {
    layer: string;
    action: string;
    priority: string;
  }[];
  const topNextSteps = nextSteps.slice(0, 3);

  let penaltyRes: { data: { totalMin: number; totalMax: number } } | null = null;
  if (role === "CAIO" || role === "ADMIN") {
    try {
      penaltyRes = await caller.dashboard.getEUPenaltyExposure();
    } catch {}
  }

  return (
    <main className="flex flex-col gap-6">
      {viewFull && persona && <PersonaShortcutBanner persona={persona} />}

      {showWelcome && (
        <div className="border-navy-200 bg-navy-50 rounded-lg border p-4">
          <h3 className="text-navy-900 text-lg font-semibold">
            {personaLabel
              ? `Welcome, ${displayName}. As ${personaLabel}, your priority this week is ${topNextSteps[0]?.action ?? "maintaining your governance posture"}.`
              : `Welcome to AI Readiness Platform`}
          </h3>
          <ul className="mt-3 space-y-2">
            {(personaLabel ? topNextSteps.slice(1) : topNextSteps).map((s, i) => (
              <li
                key={`${s.layer}-${s.action}`}
                className="text-navy-700 flex items-center gap-2 text-sm"
              >
                <span className="bg-navy-200 text-navy-800 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                  {i + 1}
                </span>
                {s.action}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Posture Overview</h2>
          <p className="mt-0.5 text-sm text-slate-600">
            Your AI readiness posture across the CoSAI five-layer framework
          </p>
        </div>
      </div>

      {showFinancial(role) && penaltyRes && (
        <div className="overflow-visible rounded-lg border border-l-4 border-slate-200 border-l-red-600 bg-white shadow-sm">
          <div className="bg-red-50/50 p-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-red-700">
                EU AI Act Penalty Exposure (CAIO view)
              </h3>
              <Tooltip
                content="Range based on high-risk asset count and Article 99 penalty tiers."
                side="bottom"
              >
                <Info className="h-4 w-4 text-red-600" />
              </Tooltip>
            </div>
            <p className="mt-1 text-2xl font-bold text-red-600">
              €{(penaltyRes.data.totalMin / 1_000_000).toFixed(1)}M – €
              {(penaltyRes.data.totalMax / 1_000_000).toFixed(1)}M
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

      {/* KPI cards — stream in */}
      <Suspense
        fallback={
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
            {Array.from({ length: 9 }).map((_, i) => (
              <KpiSkeleton key={i} />
            ))}
          </div>
        }
      >
        <KpiCards orgId={orgId} />
      </Suspense>

      {/* Sankey — stream in */}
      <Suspense fallback={<CardSkeleton height="h-64" />}>
        <SankeySection orgId={orgId} />
      </Suspense>

      {/* Maturity — stream in */}
      <Suspense fallback={<CardSkeleton height="h-80" />}>
        <MaturitySection orgId={orgId} />
      </Suspense>

      {/* Heatmap + Risk matrix — stream in */}
      <Suspense
        fallback={
          <div className="grid gap-6 lg:grid-cols-2">
            <CardSkeleton height="h-48" />
            <CardSkeleton height="h-48" />
          </div>
        }
      >
        <HeatmapAndRisk orgId={orgId} />
      </Suspense>

      {/* Bottom panels — stream in last */}
      <Suspense
        fallback={
          <div className="grid gap-6 lg:grid-cols-2">
            <CardSkeleton height="h-48" />
            <CardSkeleton height="h-48" />
          </div>
        }
      >
        <BottomPanels />
      </Suspense>
    </main>
  );
}

function showFinancial(role: string) {
  return role === "CAIO" || role === "ADMIN";
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
          <span className="text-xs font-medium tracking-wide text-slate-500 uppercase">{label}</span>
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
