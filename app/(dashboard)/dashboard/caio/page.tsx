/**
 * CAIO unified view – cross-layer summary, maturity, KPIs, critical gaps.
 */
import Link from "next/link";
import { Bot, ShieldCheck, AlertTriangle, TrendingUp, Layers } from "lucide-react";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { MaturityRadarChart, type LayerScores } from "@/components/maturity/MaturityRadarChart";
import { PersonaDashboardShell } from "@/components/dashboard/PersonaDashboardShell";
import { complianceBarBgClass, complianceTextClass } from "@/lib/ui/compliance-score";

const LAYER_LABELS: Record<string, string> = {
  LAYER_1_BUSINESS: "Layer 1: Business",
  LAYER_2_INFORMATION: "Layer 2: Information",
  LAYER_3_APPLICATION: "Layer 3: Application",
  LAYER_4_PLATFORM: "Layer 4: Platform",
  LAYER_5_SUPPLY_CHAIN: "Layer 5: Supply Chain"
};

const LAYER_LINKS: Record<string, string> = {
  LAYER_1_BUSINESS: "/layer1-business",
  LAYER_2_INFORMATION: "/layer2-information",
  LAYER_3_APPLICATION: "/layer3-application/assets",
  LAYER_4_PLATFORM: "/layer4-platform",
  LAYER_5_SUPPLY_CHAIN: "/layer5-supply-chain"
};

const COSAI_LAYERS = [
  "LAYER_1_BUSINESS",
  "LAYER_2_INFORMATION",
  "LAYER_3_APPLICATION",
  "LAYER_4_PLATFORM",
  "LAYER_5_SUPPLY_CHAIN"
] as const;

const MATURITY_COLORS: Record<number, string> = {
  1: "#fbbf24",
  2: "#f97316",
  3: "#3b82f6",
  4: "#8b5cf6",
  5: "#10b981"
};

/** Card / panel section label — matches Posture Overview scale */
const SECTION_HEADING =
  "mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500";

export default async function CAIODashboardPage() {
  const caller = await createServerCaller();

  const [kpisRes, layerRes, gapsRes, maturityRes, topRisksRes] = await Promise.all([
    caller.dashboard.getKPIs(),
    caller.dashboard.getLayerPosture(),
    caller.dashboard.getTopGaps({ limit: 5 }),
    caller.maturity.getMaturityScore(),
    caller.dashboard.getTopRisksByLayer()
  ]);

  const kpis = kpisRes.data;
  const layers = layerRes.data;
  const gaps = gapsRes.data;
  const maturity = maturityRes.data;
  const topRisks = topRisksRes.data;

  const layerMap = new Map(layers.map((l) => [l.layer, l]));

  return (
    <PersonaDashboardShell
      title="CAIO Unified View"
      subtitle="Cross-layer readiness summary across all CoSAI layers."
    >
      <div className="flex flex-col gap-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/layer3-application/assets"
            className="hover:border-navy-300 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow"
          >
            <div className="flex items-center gap-2">
              <Bot className="text-navy-600 h-5 w-5" />
              <span className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                Total Assets
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">{kpis.totalAssets}</p>
          </Link>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <ShieldCheck className={`h-5 w-5 ${complianceTextClass(kpis.complianceScore)}`} />
              <span className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                Compliance Score
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">{kpis.complianceScore}%</p>
          </div>
          <Link
            href="/maturity"
            className="hover:border-navy-300 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow"
          >
            <div className="flex items-center gap-2">
              <TrendingUp
                className="h-5 w-5"
                style={{ color: MATURITY_COLORS[maturity.maturityLevel] ?? "#fbbf24" }}
              />
              <span className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                Maturity
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">M{maturity.maturityLevel}</p>
          </Link>
          <Link
            href="/layer3-application/gaps"
            className="hover:border-navy-300 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                Critical Gaps
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">{gaps.length}</p>
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className={SECTION_HEADING}>
              <TrendingUp className="text-navy-600 h-4 w-4" />
              Maturity by Layer
            </h2>
            <div className="flex justify-center">
              <MaturityRadarChart
                scores={maturity.scores as LayerScores}
                targetLevel={3}
                size={280}
                interactive={true}
              />
            </div>
            <p className="mt-2 text-center text-xs text-slate-500">
              M3 target = minimum regulatory compliance
            </p>
            <Link
              href="/maturity"
              className="text-navy-600 mt-2 block text-center text-sm font-medium hover:underline"
            >
              View full assessment →
            </Link>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className={SECTION_HEADING}>
              <Layers className="text-navy-600 h-5 w-5" />
              Cross-Layer Summary
            </h2>
            <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {COSAI_LAYERS.map((layer) => {
                const data = layerMap.get(layer);
                const topRisk = topRisks[layer];
                const href = LAYER_LINKS[layer];
                const label = LAYER_LABELS[layer] ?? layer;
                const compliancePct = data?.compliancePct ?? 0;
                const owner = data?.accountableOwner ?? "—";

                return (
                  <Link
                    key={layer}
                    href={href}
                    className="hover:border-navy-300 hover:bg-navy-50/30 flex min-w-0 flex-col rounded-lg border border-slate-200 bg-slate-50 p-4 transition"
                  >
                    <span className="truncate text-sm font-medium text-slate-700">{label}</span>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span
                        className={`text-2xl font-bold ${complianceTextClass(compliancePct)}`}
                      >
                        {compliancePct}%
                      </span>
                      <span className="text-xs text-slate-500">compliance</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className={`h-full rounded-full ${complianceBarBgClass(compliancePct)}`}
                        style={{ width: `${compliancePct}%` }}
                      />
                    </div>
                    <div className="mt-3 min-w-0 space-y-1 text-xs">
                      <div className="text-slate-600">
                        <span className="font-medium">Top risk:</span>{" "}
                        <span className="break-words">{topRisk?.title ?? "None"}</span>
                      </div>
                      <div className="text-slate-500">
                        <span className="font-medium">Owner:</span> {owner}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className={SECTION_HEADING}>
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Critical Gaps
          </h2>
          {gaps.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center">
              <p className="text-sm text-slate-600">No critical gaps right now.</p>
              <p className="mt-1 text-xs text-slate-500">
                Run gap analysis from AI Assets when you add or change systems.
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
                  <Link
                    href={`/layer3-application/assets/${g.assetId}`}
                    className="text-navy-600 shrink-0 text-sm font-medium hover:underline"
                  >
                    View →
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/reports/gap-analysis"
            className="text-navy-600 mt-3 inline-block text-sm font-medium hover:underline"
          >
            Full gap analysis →
          </Link>
        </div>
      </div>
    </PersonaDashboardShell>
  );
}
