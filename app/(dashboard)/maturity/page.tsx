/**
 * Maturity Assessment – full assessment page with scores, questionnaire, and next steps.
 */
import Link from "next/link";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { MaturityAssessmentClient } from "./MaturityAssessmentClient";
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
  const [scoreRes, latestRes] = await Promise.all([
    caller.maturity.getMaturityScore(),
    caller.maturity.getLatestAssessment()
  ]);

  const { scores, maturityLevel, progressToNext, nextSteps, lastAssessedAt } = scoreRes.data;
  const latest = latestRes.data;

  const layerKeys = ["L1", "L2", "L3", "L4", "L5"] as const;

  return (
    <main className="mx-auto flex min-h-dvh max-w-4xl flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Maturity Assessment</h1>
        <p className="mt-1 text-slate-600">
          Assess your AI governance maturity across the five CoSAI layers.
        </p>
      </div>

      {/* Current scores – horizontal bar chart per layer */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-medium text-slate-700">Current Scores by Layer</h2>
        <div className="space-y-3">
          {layerKeys.map((layer) => {
            const score = scores[layer] ?? 1;
            const widthPct = ((score - 1) / 4) * 100;
            const color = getScoreColor(score);
            return (
              <div key={layer} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-sm font-medium text-slate-700">
                  {LAYER_LABELS[layer]}
                </span>
                <div className="flex-1 h-6 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${widthPct}%`, backgroundColor: color }}
                  />
                </div>
                <span className="w-12 shrink-0 text-right text-sm font-medium text-slate-700">
                  {score.toFixed(1)}
                </span>
                <Link
                  href={`/maturity/${layer}`}
                  className="text-xs text-navy-600 hover:underline"
                >
                  Details →
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress indicator */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-medium text-slate-700">Maturity Progress</h2>
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
    </main>
  );
}
