/**
 * Layer-specific maturity drill-down.
 */
import Link from "next/link";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { LAYER_LABELS, MATURITY_QUESTIONS, MATURITY_LEVEL_LABELS } from "@/lib/maturity/questions";
import { getControlsForLevel, getControlsForNextLevel } from "@/lib/maturity/controls-matrix";
import type { MaturityLayer } from "@/lib/maturity/questions";
import { notFound } from "next/navigation";

const MATURITY_COLORS: Record<number, string> = {
  1: "#fbbf24",
  2: "#f97316",
  3: "#3b82f6",
  4: "#8b5cf6",
  5: "#10b981"
};

const VALID_LAYERS: MaturityLayer[] = ["L1", "L2", "L3", "L4", "L5"];

export default async function MaturityLayerPage({
  params
}: {
  params: Promise<{ layer: string }>;
}) {
  const { layer } = await params;
  const layerKey = layer.toUpperCase() as MaturityLayer;
  if (!VALID_LAYERS.includes(layerKey)) notFound();

  const caller = await createServerCaller();
  const [scoreRes, latestRes] = await Promise.all([
    caller.maturity.getMaturityScore(),
    caller.maturity.getLatestAssessment()
  ]);

  const scores = scoreRes.data.scores;
  const layerScore = scores[layerKey] ?? 1;
  const currentLevel = Math.floor(layerScore);
  const nextLevel = Math.min(currentLevel + 1, 5);

  const layerQuestions = MATURITY_QUESTIONS.filter((q) => q.layer === layerKey);
  const answers = latestRes.data?.answers ?? [];

  const controlsCurrent = getControlsForLevel(layerKey, currentLevel);
  const controlNext = getControlsForNextLevel(layerKey, currentLevel);

  return (
    <main className="mx-auto flex min-h-dvh max-w-4xl flex-col gap-6 px-6 py-10">
      <div>
        <Link href="/maturity" className="text-sm text-navy-600 hover:underline">
          ← Maturity Assessment
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          {LAYER_LABELS[layerKey]}
        </h1>
        <p className="mt-1 text-slate-600">
          Current score: {layerScore.toFixed(1)} — {MATURITY_LEVEL_LABELS[currentLevel]}
        </p>
      </div>

      {/* Current score bar */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-medium text-slate-700">Current Score</h2>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-8 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${(layerScore / 5) * 100}%`,
                backgroundColor: MATURITY_COLORS[currentLevel] ?? MATURITY_COLORS[1]
              }}
            />
          </div>
          <span className="text-lg font-semibold text-slate-900">{layerScore.toFixed(1)}</span>
        </div>
      </div>

      {/* Questions answered */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-medium text-slate-700">Questions & Scores</h2>
        <ul className="space-y-2">
          {layerQuestions.map((q) => {
            const a = answers.find((x) => x.questionId === q.id);
            const score = a?.score ?? 0;
            return (
              <li
                key={q.id}
                className="flex items-center justify-between rounded border border-slate-200 bg-slate-50 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{q.question}</p>
                  <p className="text-xs text-slate-500">{q.hint}</p>
                </div>
                <span
                  className="rounded px-2 py-0.5 text-sm font-medium"
                  style={{
                    backgroundColor: score > 0 ? `${MATURITY_COLORS[score]}20` : "transparent",
                    color: score > 0 ? MATURITY_COLORS[score] : "#64748b"
                  }}
                >
                  {score > 0 ? score : "—"}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Controls required at current level */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-medium text-slate-700">
          Controls at Current Level ({MATURITY_LEVEL_LABELS[currentLevel]})
        </h2>
        <ul className="space-y-2">
          {controlsCurrent.map((c) => (
            <li key={c.id}>
              <Link
                href={c.href}
                className="flex items-center justify-between rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-navy-600 hover:bg-slate-100 hover:underline"
              >
                <span>{c.title}</span>
                <span className="text-xs text-slate-500">→</span>
              </Link>
              {c.description && (
                <p className="mt-0.5 pl-3 text-xs text-slate-500">{c.description}</p>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Controls required at next level */}
      {controlNext && currentLevel < 5 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-medium text-slate-700">
            Next: Control for {MATURITY_LEVEL_LABELS[nextLevel]}
          </h2>
          <Link
            href={controlNext.href}
            className="flex items-center justify-between rounded border border-amber-200 bg-white px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-50"
          >
            <span>{controlNext.title}</span>
            <span className="text-xs text-amber-600">View →</span>
          </Link>
          {controlNext.description && (
            <p className="mt-2 text-xs text-slate-600">{controlNext.description}</p>
          )}
        </div>
      )}

      <Link
        href="/maturity"
        className="rounded bg-navy-600 px-4 py-2 text-sm font-medium text-white hover:bg-navy-500"
      >
        Back to Assessment
      </Link>
    </main>
  );
}
