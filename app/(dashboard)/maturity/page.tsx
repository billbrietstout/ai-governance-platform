/**
 * Maturity Assessment – full assessment page with scores, questionnaire, and next steps.
 */
import Link from "next/link";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { MaturityAssessmentClient } from "./MaturityAssessmentClient";
import { MaturityRadarSection } from "./MaturityRadarSection";
import type { LayerScores } from "@/components/maturity/MaturityRadarChart";
import { LAYER_LABELS, MATURITY_LEVEL_LABELS } from "@/lib/maturity/questions";

/** Color for a given score (1.0–5.0) based on maturity level thresholds */
function getScoreColor(score: number): string {
  if (score >= 5) return "#10b981"; // M5 Optimised
  if (score >= 4) return "#8b5cf6";  // M4 Measured
  if (score >= 3) return "#3b82f6";  // M3 Implemented
  if (score >= 2) return "#f97316";  // M2 Documented
  return "#fbbf24";                  // M1 Aware
}

const MATURITY_LEVEL_COLORS: Record<number, string> = {
  1: "#fbbf24",
  2: "#f97316",
  3: "#3b82f6",
  4: "#8b5cf6",
  5: "#10b981"
};

export default async function MaturityPage() {
  const caller = await createServerCaller();
  const [scoreRes, latestRes, prevRes] = await Promise.all([
    caller.maturity.getMaturityScore(),
    caller.maturity.getLatestAssessment(),
    caller.maturity.getPreviousAssessment()
  ]);

  const { scores, maturityLevel, progressToNext, nextSteps, lastAssessedAt } = scoreRes.data;
  const latest = latestRes.data;
  const previousScores = (prevRes.data?.scores as { L1: number; L2: number; L3: number; L4: number; L5: number } | null) ?? null;
  const targetLevel = Math.min(maturityLevel + 1, 5);

  return (
    <main className="mx-auto flex min-h-dvh max-w-4xl flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">AI Readiness Assessment</h1>
        <p className="mt-1 text-slate-600">
          Measure your organization&apos;s AI governance maturity across the five CoSAI layers.
        </p>
      </div>

      {/* Current scores – radar chart */}
      <MaturityRadarSection
        scores={scores as LayerScores}
        targetLevel={targetLevel}
        previousScores={previousScores}
      />

      {/* Progress indicator */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-medium text-slate-700">Readiness score</h2>
        <div className="flex items-center gap-4">
          <div
            className="rounded-lg px-3 py-1.5 text-sm font-semibold text-white"
            style={{ backgroundColor: MATURITY_LEVEL_COLORS[maturityLevel] ?? MATURITY_LEVEL_COLORS[1] }}
          >
            {MATURITY_LEVEL_LABELS[maturityLevel]}
          </div>
          <div className="flex-1">
            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${progressToNext}%`,
                  backgroundColor: maturityLevel >= 5 ? "#10b981" : MATURITY_LEVEL_COLORS[maturityLevel + 1] ?? "#3b82f6"
                }}
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {maturityLevel >= 5
                ? "Maximum maturity reached"
                : `${progressToNext}% toward ${MATURITY_LEVEL_LABELS[maturityLevel + 1]}`}
            </p>
          </div>
        </div>
      </div>

      {/* Next steps panel */}
      {nextSteps.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-medium text-slate-700">Next Steps</h2>
          <p className="mb-3 text-xs text-slate-500">
            Recommended actions to advance to the next maturity level.
          </p>
          <ul className="space-y-2">
            {nextSteps.map((s) => (
              <li
                key={`${s.layer}-${s.action}`}
                className="flex items-center justify-between rounded border border-slate-200 bg-slate-50 px-3 py-2"
              >
                <span className="text-sm text-slate-700">{s.action}</span>
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${
                    s.priority === "high"
                      ? "bg-amber-100 text-amber-700"
                      : s.priority === "medium"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {LAYER_LABELS[s.layer]}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Assessment questionnaire */}
      <MaturityAssessmentClient
        latestAssessment={latest}
        lastAssessedAt={lastAssessedAt}
        currentScores={scores}
      />

      {/* M5 Roadmap – visible when maturityLevel >= 4 */}
      {maturityLevel >= 4 && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-6">
          <h2 className="mb-2 text-lg font-semibold text-slate-900">Path to M5 Certification</h2>
          <p className="mb-4 text-sm text-slate-600">
            You&apos;re at M4 or higher. Complete these steps to reach M5 Optimised and achieve
            full certification readiness.
          </p>
          <ul className="space-y-3">
            <li className="flex items-center gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-200 text-xs font-bold text-emerald-800">
                1
              </span>
              <Link href="/compliance/iso42001" className="text-navy-600 hover:underline">
                ISO 42001 certification readiness
              </Link>
              — Complete clause-by-clause checklist
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-200 text-xs font-bold text-emerald-800">
                2
              </span>
              <Link href="/compliance/eu-ai-act" className="text-navy-600 hover:underline">
                EU AI Act conformity
              </Link>
              — High-risk asset conformity assessment
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-200 text-xs font-bold text-emerald-800">
                3
              </span>
              <span>CE marking readiness</span>
              — Technical documentation and declaration
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-200 text-xs font-bold text-emerald-800">
                4
              </span>
              <span>Independent model validation</span>
              — Third-party assessment of critical systems
            </li>
          </ul>
          <p className="mt-4 text-xs text-slate-500">
            Estimated timeline to M5: {maturityLevel === 4 ? "3–6 months" : "1–3 months"} based on
            current gaps. Address next steps above to accelerate.
          </p>
        </div>
      )}
    </main>
  );
}
