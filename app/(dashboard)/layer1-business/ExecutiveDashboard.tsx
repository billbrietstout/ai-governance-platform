"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Landmark,
  HeartPulse,
  Shield,
  Factory,
  Building2,
  Zap,
  Users,
  Car,
  Radio,
  ShoppingCart
} from "lucide-react";
import { ComplianceRing } from "@/components/assets/ComplianceRing";
import { ComplianceTrendChart } from "@/components/compliance/ComplianceTrendChart";
import { RiskTreemap } from "@/components/supply-chain/RiskTreemap";

const TABS = [
  { id: "ceo", label: "CEO View" },
  { id: "cfo", label: "CFO View" },
  { id: "coo", label: "COO View" },
  { id: "ciso", label: "CISO View" },
  { id: "legal", label: "Legal/CLO View" },
  { id: "portfolio", label: "Vertical Portfolio" }
] as const;

type CEOData = {
  aiRiskExposure: number;
  reputationalRisk: number;
  regulatoryExposure: string;
  aiIncidents: number;
  governanceCoverage: number;
  posture: "red" | "amber" | "green";
  maturityLevel?: number;
  maturitySummary?: string | null;
  summary: string;
};

type CFOData = {
  complianceCostExposure: { range: string } | null;
  assetsByAutonomy: Record<string, number>;
  auditRisk: number;
  aiSpendGovernance: number;
  failedScanCount: number;
};

type COOData = {
  businessProcessCoverage: Record<string, { total: number; governed: number; autonomous: number }>;
  shadowAiRisk: number;
  autonomyDistribution: Record<string, number>;
  humanOversightGaps: number;
};

type CISOData = {
  failedScanPolicies: Record<string, number>;
  vendorSecurityPosture: { vendorName: string; soc2: boolean; iso: boolean }[];
  highRiskNoScan90d: number;
  promptInjectionFindings: number;
  attackSurface: number;
};

type LegalData = {
  annexIIIAssets: { id: string; name: string; assetType: string; articles: string[] }[];
  accountabilityCompleteness: { total: number; complete: number; pct: number };
  noAppealsProcess: number;
  verticalRegulations: { code: string; name: string; jurisdiction: string; mandatory: boolean }[];
  verticalLabel: string;
  contractAlignmentGaps: number;
};

type PortfolioVertical = {
  verticalKey: string;
  label: string;
  regulations: {
    regulation: { code: string; name: string; jurisdiction: string };
    status: string;
  }[];
  assetCount: number;
  complianceScore: number;
};

type PortfolioData = {
  verticals: PortfolioVertical[];
};

type SnapshotForChart = {
  id: string;
  createdAt: Date;
  overallScore: number;
  layerScores?: unknown;
};

type VendorRiskScore = {
  vendorId: string;
  vendorName: string;
  overallScore: number;
  evidenceCurrency: number;
  contractAligned: boolean | null;
  scanCoverage: number;
  modelCount?: number;
  cosaiLayer?: string | null;
};

type Props = {
  ceo: CEOData;
  cfo: CFOData;
  coo: COOData;
  ciso: CISOData;
  legal: LegalData;
  portfolio: PortfolioData;
  recentSnapshots?: SnapshotForChart[];
  vendorRiskScores?: VendorRiskScore[];
};

const VERTICAL_ICONS: Record<string, { icon: React.ReactNode; color: string }> = {
  FINANCIAL_SERVICES: { icon: <Landmark className="h-5 w-5" />, color: "text-blue-600" },
  HEALTHCARE: { icon: <HeartPulse className="h-5 w-5" />, color: "text-red-600" },
  INSURANCE: { icon: <Shield className="h-5 w-5" />, color: "text-purple-600" },
  GENERAL: { icon: <Factory className="h-5 w-5" />, color: "text-gray-600" },
  PUBLIC_SECTOR: { icon: <Building2 className="h-5 w-5" />, color: "text-amber-600" },
  ENERGY: { icon: <Zap className="h-5 w-5" />, color: "text-yellow-600" },
  HR_SERVICES: { icon: <Users className="h-5 w-5" />, color: "text-green-600" },
  AUTOMOTIVE: { icon: <Car className="h-5 w-5" />, color: "text-slate-700" },
  TELECOM: { icon: <Radio className="h-5 w-5" />, color: "text-indigo-600" },
  MANUFACTURING: { icon: <Factory className="h-5 w-5" />, color: "text-orange-600" },
  RETAIL: { icon: <ShoppingCart className="h-5 w-5" />, color: "text-teal-600" }
};

export function ExecutiveDashboard({
  ceo,
  cfo,
  coo,
  ciso,
  legal,
  portfolio,
  recentSnapshots = [],
  vendorRiskScores = []
}: Props) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("ceo");

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto border-b border-slate-200">
        <div className="flex min-w-max gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`shrink-0 border-b-2 px-4 py-2 text-sm font-medium whitespace-nowrap transition ${
                tab === t.id
                  ? "border-navy-600 text-navy-600"
                  : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "ceo" && <CEOView data={ceo} />}
      {tab === "cfo" && <CFOView data={cfo} recentSnapshots={recentSnapshots} />}
      {tab === "coo" && <COOView data={coo} />}
      {tab === "ciso" && <CISOView data={ciso} vendorRiskScores={vendorRiskScores} />}
      {tab === "legal" && <LegalCLOView data={legal} />}
      {tab === "portfolio" && <VerticalPortfolioView data={portfolio} />}
    </div>
  );
}

const MATURITY_COLORS: Record<number, string> = {
  1: "#fbbf24",
  2: "#f97316",
  3: "#3b82f6",
  4: "#8b5cf6",
  5: "#10b981"
};

function CEOView({ data: d }: { data: CEOData }) {
  const postureColor =
    d.posture === "green"
      ? "bg-emerald-500"
      : d.posture === "amber"
        ? "bg-amber-500"
        : "bg-red-500";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className={`h-4 w-4 shrink-0 rounded-full ${postureColor}`} title={d.posture} />
        <p className="text-slate-700">{d.summary}</p>
      </div>

      {(d.maturityLevel != null || d.maturitySummary) && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            {d.maturityLevel != null && (
              <span
                className="rounded-lg px-3 py-1.5 text-sm font-semibold text-white"
                style={{ backgroundColor: MATURITY_COLORS[d.maturityLevel] ?? "#fbbf24" }}
              >
                M{d.maturityLevel}
              </span>
            )}
            {d.maturitySummary && <p className="text-sm text-slate-600">{d.maturitySummary}</p>}
          </div>
          <Link
            href="/maturity"
            className="text-navy-600 mt-2 inline-block text-sm font-medium hover:underline"
          >
            View maturity assessment →
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard label="Ungoverned High-Risk AI" value={d.aiRiskExposure} />
        <MetricCard
          label="Reputational Risk"
          value={d.reputationalRisk}
          sub="autonomous without oversight"
        />
        <MetricCard label="Regulatory Exposure" value={d.regulatoryExposure} />
        <MetricCard label="AI Incidents (90d)" value={d.aiIncidents} />
        <MetricCard label="Governance Coverage" value={`${d.governanceCoverage}%`} />
      </div>
    </div>
  );
}

function CFOView({
  data: d,
  recentSnapshots
}: {
  data: CFOData;
  recentSnapshots: SnapshotForChart[];
}) {
  const chartSnapshots = recentSnapshots.slice(0, 5).reverse();

  return (
    <div className="space-y-6">
      {chartSnapshots.length >= 2 && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h4 className="mb-2 text-sm font-medium text-slate-700">Compliance trend</h4>
          <ComplianceTrendChart snapshots={chartSnapshots} compact />
          <Link
            href="/compliance/snapshots"
            className="text-navy-600 mt-2 inline-block text-sm font-medium hover:underline"
          >
            View full history →
          </Link>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {d.complianceCostExposure && (
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h4 className="text-sm font-medium text-slate-600">Compliance Cost Exposure</h4>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {d.complianceCostExposure.range}
            </p>
          </div>
        )}
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h4 className="text-sm font-medium text-slate-600">Assets by Autonomy</h4>
          <div className="mt-2 space-y-1 text-sm text-slate-700">
            {Object.entries(d.assetsByAutonomy).map(([k, v]) => (
              <div key={k}>
                {k === "UNSET" ? "—" : k}: {v}
              </div>
            ))}
          </div>
        </div>
        <MetricCard label="Audit Risk" value={d.auditRisk} sub="HIGH risk, no attestation" />
        <MetricCard
          label="AI Spend Governance"
          value={`${d.aiSpendGovernance}%`}
          sub="contracts aligned"
        />
        <MetricCard label="Failed Scan Policies" value={d.failedScanCount} />
      </div>
    </div>
  );
}

function COOView({ data: d }: { data: COOData }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <MetricCard label="Shadow AI Risk" value={d.shadowAiRisk} sub="DRAFT, no accountability" />
        <MetricCard
          label="Human Oversight Gaps"
          value={d.humanOversightGaps}
          sub="autonomous without review"
        />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h4 className="mb-3 text-sm font-medium text-slate-700">Business Process Coverage</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-2 text-left font-medium text-slate-600">Function</th>
                <th className="py-2 text-right font-medium text-slate-600">Total</th>
                <th className="py-2 text-right font-medium text-slate-600">Governed</th>
                <th className="py-2 text-right font-medium text-slate-600">Autonomous</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(d.businessProcessCoverage).map(([fn, v]) => (
                <tr key={fn} className="border-b border-slate-100 last:border-0">
                  <td className="py-2 font-medium text-slate-900">{fn.replace("_", " ")}</td>
                  <td className="py-2 text-right text-slate-700">{v.total}</td>
                  <td className="py-2 text-right text-slate-700">{v.governed}</td>
                  <td className="py-2 text-right text-slate-700">{v.autonomous}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h4 className="mb-2 text-sm font-medium text-slate-700">Autonomy Distribution</h4>
        <div className="flex flex-wrap gap-4 text-sm text-slate-700">
          {Object.entries(d.autonomyDistribution).map(([k, v]) => (
            <span key={k}>
              {k === "UNSET" ? "—" : k}: {v}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function CISOView({
  data: d,
  vendorRiskScores = []
}: {
  data: CISOData;
  vendorRiskScores?: VendorRiskScore[];
}) {
  const treemapVendors = vendorRiskScores.slice(0, 8).map((v) => ({
    id: v.vendorId,
    vendorName: v.vendorName,
    overallScore: v.overallScore,
    evidenceCurrency: v.evidenceCurrency,
    contractAligned: v.contractAligned,
    scanCoverage: v.scanCoverage,
    modelCount: v.modelCount ?? 1,
    cosaiLayer: v.cosaiLayer ?? null
  }));

  return (
    <div className="space-y-6">
      {treemapVendors.length >= 1 && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h4 className="mb-2 text-sm font-medium text-slate-700">Supply chain risk exposure</h4>
          <RiskTreemap vendors={treemapVendors} compact />
          <Link
            href="/layer5-supply-chain/risk-score"
            className="text-navy-600 mt-2 inline-block text-sm font-medium hover:underline"
          >
            View full supply chain →
          </Link>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard label="Failed Scan Policies" value={Object.keys(d.failedScanPolicies).length} />
        <MetricCard label="Vendors Expired Certs" value={d.vendorSecurityPosture.length} />
        <MetricCard label="HIGH Risk, No Scan 90d" value={d.highRiskNoScan90d} />
        <MetricCard label="Prompt Injection Findings" value={d.promptInjectionFindings} />
        <MetricCard label="Attack Surface" value={d.attackSurface} sub="external-facing AI" />
      </div>

      {Object.keys(d.failedScanPolicies).length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h4 className="mb-2 text-sm font-medium text-slate-700">Failed Scans by Type</h4>
          <div className="flex flex-wrap gap-4 text-sm">
            {Object.entries(d.failedScanPolicies).map(([k, v]) => (
              <span key={k} className="rounded bg-red-100 px-2 py-0.5 text-red-700">
                {k}: {v}
              </span>
            ))}
          </div>
        </div>
      )}

      {d.vendorSecurityPosture.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h4 className="mb-2 text-sm font-medium text-slate-700">Vendors with Expired Evidence</h4>
          <ul className="space-y-1 text-sm text-slate-700">
            {d.vendorSecurityPosture.map((v, i) => (
              <li key={i}>
                {v.vendorName} {v.soc2 && "(SOC2 expired)"} {v.iso && "(ISO expired)"}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function LegalCLOView({ data: d }: { data: LegalData }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <MetricCard
          label="Accountability Completeness"
          value={`${d.accountabilityCompleteness.pct}%`}
          sub={`${d.accountabilityCompleteness.complete}/${d.accountabilityCompleteness.total} HIGH risk`}
        />
        <MetricCard label="No Appeals Process" value={d.noAppealsProcess} sub="HIGH risk assets" />
        <MetricCard label="Contract Alignment Gaps" value={d.contractAlignmentGaps} />
      </div>

      {d.annexIIIAssets.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h4 className="mb-3 text-sm font-medium text-slate-700">EU AI Act Annex III Assets</h4>
          <ul className="space-y-2">
            {d.annexIIIAssets.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between rounded border border-slate-200 bg-slate-50 px-3 py-2"
              >
                <div>
                  <Link
                    href={`/layer3-application/assets/${a.id}`}
                    className="text-navy-600 font-medium hover:underline"
                  >
                    {a.name}
                  </Link>
                  <span className="ml-2 text-xs text-slate-500">{a.assetType}</span>
                </div>
                <div className="flex gap-2 text-xs text-slate-600">
                  {a.articles.map((art) => (
                    <span key={art} className="rounded bg-amber-100 px-2 py-0.5 text-amber-800">
                      {art}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h4 className="mb-3 text-sm font-medium text-slate-700">
          Vertical Compliance Requirements ({d.verticalLabel})
        </h4>
        <p className="mb-3 text-xs text-slate-500">
          Regulations applicable to your industry. Status: compliant / gap / unknown.
        </p>
        <ul className="space-y-2">
          {d.verticalRegulations.map((r) => (
            <li
              key={r.code}
              className="flex items-center justify-between rounded border border-slate-200 bg-slate-50 px-3 py-2"
            >
              <div>
                <span className="font-medium text-slate-900">{r.name}</span>
                <span className="ml-2 text-xs text-slate-500">
                  {r.code} · {r.jurisdiction}
                </span>
              </div>
              <span
                className={`rounded px-2 py-0.5 text-xs ${
                  r.mandatory ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"
                }`}
              >
                {r.mandatory ? "Mandatory" : "Recommended"}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function VerticalPortfolioView({ data }: { data: PortfolioData }) {
  if (!data.verticals?.length) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
        <p className="text-sm text-slate-600">
          No client verticals configured. Add verticals in{" "}
          <Link href="/settings/organization" className="text-navy-600 font-medium hover:underline">
            Settings → Organization
          </Link>{" "}
          to see compliance by vertical.
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.verticals.map((v) => {
          const meta = VERTICAL_ICONS[v.verticalKey] ?? {
            icon: <Factory className="h-5 w-5" />,
            color: "text-gray-600"
          };
          return (
            <div
              key={v.verticalKey}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300"
            >
              <div className="flex items-center gap-2">
                <span className={meta.color}>{meta.icon}</span>
                <h4 className="font-medium text-slate-900">{v.label}</h4>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                {v.assetCount} asset{v.assetCount !== 1 ? "s" : ""} in scope
              </p>
              <div className="mt-2">
                <ComplianceRing percentage={v.complianceScore} size={32} strokeWidth={3} />
              </div>
              <ul className="mt-3 space-y-1">
                {v.regulations.slice(0, 3).map((r) => (
                  <li key={r.regulation.code} className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">{r.regulation.code}</span>
                    <span
                      className={`rounded px-1.5 py-0.5 ${
                        r.status === "COMPLIANT"
                          ? "bg-emerald-100 text-emerald-700"
                          : r.status === "GAP"
                            ? "bg-amber-100 text-amber-700"
                            : r.status === "NOT_APPLICABLE"
                              ? "bg-slate-100 text-slate-500"
                              : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {r.status}
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                href={`/layer1-business/verticals/${v.verticalKey.toLowerCase().replace(/_/g, "-")}`}
                className="text-navy-600 mt-3 block text-sm font-medium hover:underline"
              >
                View Details →
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  sub
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h4 className="text-sm font-medium text-slate-600">{label}</h4>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}
