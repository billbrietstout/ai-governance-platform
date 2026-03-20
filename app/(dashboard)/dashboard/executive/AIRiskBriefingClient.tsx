"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";
import { DecisionModal } from "./DecisionModal";

const MATURITY_PLAIN: Record<number, string> = {
  1: "aware of AI risks but no formal governance yet",
  2: "basic governance in place — policies and documentation",
  3: "governance implemented — controls and accountability assigned",
  4: "measuring and monitoring — continuous improvement",
  5: "optimised — mature AI governance program"
};

const EU_DEADLINE = new Date("2026-08-02");
const DAYS_TO_DEADLINE = Math.ceil((EU_DEADLINE.getTime() - Date.now()) / (24 * 60 * 60 * 1000));

type BriefingData = {
  orgName: string;
  compliancePct: number;
  penaltyMin: number;
  penaltyMax: number;
  euHighRisk: number;
  totalAssets: number;
  withoutAccountability: number;
  highRiskWithoutAccountability: number;
  maturityLevel: number;
  gapCount: number;
  missingControlsPct: number;
  assetsByRisk: Record<string, number>;
  lastUpdated: Date;
};

type Props = {
  data: BriefingData;
};

function TrafficLight({ status }: { status: "red" | "amber" | "green" }) {
  const colors = {
    red: "bg-red-500",
    amber: "bg-amber-500",
    green: "bg-emerald-500"
  };
  return <div className={`h-4 w-4 shrink-0 rounded-full ${colors[status]}`} aria-label={status} />;
}

function getLegalStatus(data: BriefingData): "red" | "amber" | "green" {
  if (data.penaltyMax > 10_000_000) return "red";
  if (data.compliancePct < 60 && data.euHighRisk > 0) return "red";
  if (data.penaltyMax >= 1_000_000 && data.penaltyMax <= 10_000_000) return "amber";
  if (data.compliancePct < 80 && data.euHighRisk > 0) return "amber";
  return "green";
}

function getSafetyStatus(data: BriefingData): "red" | "amber" | "green" {
  if (data.highRiskWithoutAccountability > 0) return "red";
  if (data.missingControlsPct > 20) return "amber";
  return "green";
}

function getReadinessStatus(data: BriefingData): "red" | "amber" | "green" {
  if (data.maturityLevel < 2) return "red";
  if (data.maturityLevel === 2) return "amber";
  return "green";
}

export type DecisionType =
  | "ASSIGN_ACCOUNTABILITY_HIGH_RISK"
  | "ASSIGN_ACCOUNTABILITY"
  | "GOVERNANCE_GAPS"
  | "MATURITY_ASSESSMENT"
  | "EU_ROADMAP"
  | "APPROVE_POLICY";

function getPriorityDecision(data: BriefingData): {
  type: DecisionType;
  title: string;
  cta: string;
  count?: number;
} | null {
  if (data.highRiskWithoutAccountability > 0) {
    return {
      type: "ASSIGN_ACCOUNTABILITY_HIGH_RISK",
      title: `Assign someone responsible for ${data.highRiskWithoutAccountability} high-risk AI system${data.highRiskWithoutAccountability === 1 ? "" : "s"}`,
      cta: "Review and decide →",
      count: data.highRiskWithoutAccountability
    };
  }
  if (data.gapCount > 0) {
    return {
      type: "GOVERNANCE_GAPS",
      title: "Address governance gaps before the EU high-risk AI rules deadline",
      cta: "Review and decide →",
      count: data.gapCount
    };
  }
  if (data.maturityLevel < 3) {
    return {
      type: "MATURITY_ASSESSMENT",
      title: "Complete your governance assessment to meet regulatory requirements",
      cta: "Review and decide →"
    };
  }
  if (data.withoutAccountability > 0) {
    return {
      type: "ASSIGN_ACCOUNTABILITY",
      title: `Assign owners for ${data.withoutAccountability} AI system${data.withoutAccountability === 1 ? "" : "s"} with no one responsible`,
      cta: "Review and decide →",
      count: data.withoutAccountability
    };
  }
  return null;
}

export function AIRiskBriefingClient({ data }: Props) {
  const router = useRouter();
  const [showDetail, setShowDetail] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekLabel = `Week of ${weekStart.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`;

  const hoursAgo = Math.max(
    0,
    Math.floor((Date.now() - new Date(data.lastUpdated).getTime()) / (60 * 60 * 1000))
  );
  const lastUpdatedText =
    hoursAgo < 1 ? "Just now" : `${hoursAgo} hour${hoursAgo === 1 ? "" : "s"} ago`;

  const legalStatus = getLegalStatus(data);
  const safetyStatus = getSafetyStatus(data);
  const readinessStatus = getReadinessStatus(data);
  const decision = getPriorityDecision(data);

  const handleDecisionSuccess = useCallback(
    (message: string) => {
      setSuccessMessage(message);
      router.refresh();
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    [router]
  );

  const currentDecision = successMessage !== null ? null : decision;

  const legalSummary =
    data.euHighRisk > 0
      ? `EU high-risk AI rules apply to ${data.euHighRisk} of your AI systems. Deadline: August 2026. Current readiness: ${data.compliancePct}%.`
      : "No AI systems fall under mandatory EU high-risk rules. Voluntary standards apply.";

  const safetySummary =
    data.totalAssets > 0
      ? `${data.totalAssets} AI systems are active. ${data.gapCount > 0 ? `${data.gapCount} have unresolved governance gaps.` : "All systems have governance in place."} No critical incidents this month.`
      : "No AI systems in production yet.";

  const maturityLabel = MATURITY_PLAIN[data.maturityLevel] ?? "basic governance in place";
  const readinessSummary =
    data.maturityLevel < 5
      ? `Your AI governance: ${maturityLabel}. You need implemented governance to meet regulatory requirements by August 2026.`
      : "Your AI governance program is mature. Keep up the good work.";

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            AI Risk Briefing — {data.orgName}
          </h1>
          <p className="mt-1 text-sm text-slate-600">{weekLabel}</p>
          <p className="text-xs text-slate-500">Last updated: {lastUpdatedText}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowDetail((d) => !d)}
          className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          {showDetail ? (
            <>
              <ChevronUp className="h-4 w-4" />
              Hide detail
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              Show detail
            </>
          )}
        </button>
      </div>

      {/* Card 1 — Legal & Regulatory Exposure */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-sm font-medium text-slate-700">Legal & Regulatory Exposure</h2>
        <div className="flex items-start gap-4">
          <TrafficLight status={legalStatus} />
          <p className="flex-1 text-slate-800">{legalSummary}</p>
        </div>
        {showDetail && (
          <div className="mt-4 space-y-2 border-t border-slate-200 pt-4 text-sm text-slate-600">
            {data.euHighRisk > 0 && (
              <p>
                Penalty exposure: €{(data.penaltyMin / 1_000_000).toFixed(1)}M – €
                {(data.penaltyMax / 1_000_000).toFixed(1)}M
              </p>
            )}
            <p>Applicable: EU high-risk AI rules (August 2026)</p>
            <p>Days to nearest deadline: {Math.max(0, DAYS_TO_DEADLINE)}</p>
          </div>
        )}
      </div>

      {/* Card 2 — Operational Safety */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-sm font-medium text-slate-700">Operational Safety</h2>
        <div className="flex items-start gap-4">
          <TrafficLight status={safetyStatus} />
          <p className="flex-1 text-slate-800">{safetySummary}</p>
        </div>
        {showDetail && (
          <div className="mt-4 space-y-2 border-t border-slate-200 pt-4 text-sm text-slate-600">
            <p>
              High-risk: {data.assetsByRisk.HIGH ?? 0} • Limited: {data.assetsByRisk.LIMITED ?? 0} •
              Minimal: {data.assetsByRisk.MINIMAL ?? 0}
            </p>
            <p>Systems with no one responsible: {data.withoutAccountability}</p>
          </div>
        )}
      </div>

      {/* Card 3 — Readiness Progress */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-sm font-medium text-slate-700">Readiness Progress</h2>
        <div className="flex items-start gap-4">
          <TrafficLight status={readinessStatus} />
          <p className="flex-1 text-slate-800">{readinessSummary}</p>
        </div>
        {showDetail && (
          <div className="mt-4 space-y-3 border-t border-slate-200 pt-4 text-sm text-slate-600">
            <p>Current: {maturityLabel}</p>
            <p>
              Target: Governance implemented — controls and accountability assigned — by August 2026
            </p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={`h-2 flex-1 rounded ${
                    i <= data.maturityLevel ? "bg-navy-500" : "bg-slate-200"
                  }`}
                />
              ))}
            </div>
            <p className="text-xs">Progress toward target</p>
          </div>
        )}
      </div>

      {/* Decision box */}
      <div className="border-navy-200 bg-navy-50/50 rounded-lg border-2 p-6">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">
          One thing that needs your attention
        </h2>
        {successMessage ? (
          <p className="flex items-center gap-2 text-slate-800">
            <span className="text-emerald-600">✓</span> Done — {successMessage}
          </p>
        ) : currentDecision ? (
          <>
            <p className="text-slate-800">{currentDecision.title}</p>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="bg-navy-600 hover:bg-navy-500 mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
            >
              {currentDecision.cta}
            </button>
          </>
        ) : (
          <p className="text-slate-600">Nothing urgent this week. Next check-in: Monday.</p>
        )}
      </div>

      {modalOpen && currentDecision && (
        <DecisionModal
          decisionType={currentDecision.type}
          count={currentDecision.count}
          onClose={() => setModalOpen(false)}
          onSuccess={handleDecisionSuccess}
        />
      )}

      {/* Footer links */}
      <div className="flex flex-wrap gap-4 text-xs text-slate-500">
        <Link href="/dashboard?view=full" className="hover:text-navy-600 hover:underline">
          Full governance dashboard →
        </Link>
        <a href="/api/v1/export/governance-report" className="hover:text-navy-600 hover:underline">
          Export board briefing →
        </a>
        <span className="text-slate-400">View last week&apos;s briefing →</span>
      </div>
    </div>
  );
}
