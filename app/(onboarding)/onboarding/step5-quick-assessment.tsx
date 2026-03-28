"use client";

import { useState } from "react";
import { MATURITY_QUESTIONS, MATURITY_LEVEL_LABELS } from "@/lib/maturity/questions";
import { LAYER_META, type CosaiLayerKey } from "@/lib/ui/layer-colors";
import { QUICK_MATURITY_QUESTION_IDS } from "@/lib/onboarding/steps";
import { scoreAssessment, getMaturityLevel } from "@/lib/maturity/scoring";
import { saveStep5 } from "./actions";

const QUESTIONS = QUICK_MATURITY_QUESTION_IDS.map((id) =>
  MATURITY_QUESTIONS.find((q) => q.id === id)
).filter(Boolean) as typeof MATURITY_QUESTIONS;

const LAYER_ORDER: CosaiLayerKey[] = [
  "LAYER_1_BUSINESS",
  "LAYER_2_INFORMATION",
  "LAYER_3_APPLICATION",
  "LAYER_4_PLATFORM",
  "LAYER_5_SUPPLY_CHAIN"
];

type Props = {
  onComplete: () => void;
  isPending: boolean;
};

type AnswerState = { questionId: string; answer: number; score: number };

export function Step5QuickAssessment({ onComplete, isPending }: Props) {
  const [answers, setAnswers] = useState<AnswerState[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAnswer = (qId: string) => answers.find((a) => a.questionId === qId);

  const setAnswer = (questionId: string, score: number) => {
    setAnswers((prev) => {
      const rest = prev.filter((a) => a.questionId !== questionId);
      return [...rest, { questionId, answer: score, score }];
    });
  };

  const allAnswered = QUESTIONS.every((q) => getAnswer(q.id));

  const firstUnanswered = QUESTIONS.findIndex((q) => !getAnswer(q.id));
  const activeLayerIndex = firstUnanswered === -1 ? QUESTIONS.length - 1 : firstUnanswered;

  const [resultLevel, setResultLevel] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allAnswered) return;
    setError(null);
    try {
      const toSubmit = QUESTIONS.map((q) => {
        const a = getAnswer(q.id);
        return {
          questionId: q.id,
          answer: a?.answer ?? 1,
          score: a?.score ?? 1
        };
      });
      await saveStep5({ answers: toSubmit });
      const scores = scoreAssessment(toSubmit);
      setResultLevel(getMaturityLevel(scores.overall));
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    }
  };

  if (submitted && resultLevel !== null) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-center">
        <h3 className="text-lg font-semibold text-emerald-800">You&apos;re ready to start</h3>
        <p className="mt-2 text-emerald-700">
          Your baseline readiness score is{" "}
          <span className="font-bold">{MATURITY_LEVEL_LABELS[resultLevel]}</span>.
        </p>
        <button
          type="button"
          onClick={() => onComplete()}
          className="bg-navy-600 hover:bg-navy-500 mt-4 rounded px-4 py-2 text-sm font-medium text-white"
        >
          Go to Posture Overview
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <p className="text-sm text-slate-600">
        Answer one question per CoSAI layer to establish your baseline.
      </p>

      <div className="mb-6 flex items-center gap-2">
        {LAYER_ORDER.map((key, i) => {
          const meta = LAYER_META[key];
          const status =
            i < activeLayerIndex ? "done" : i === activeLayerIndex ? "active" : "todo";
          return (
            <div
              key={key}
              className={`flex-1 rounded py-2 text-center text-xs font-medium transition ${
                status === "done"
                  ? `${meta.bg} ${meta.text} opacity-70`
                  : status === "active"
                    ? `${meta.bg} ${meta.border} ${meta.text} border-2`
                    : "bg-slate-100 text-slate-400"
              }`}
            >
              L{meta.number}
              <span className="hidden sm:inline"> · {meta.shortLabel}</span>
            </div>
          );
        })}
      </div>

      <div className="space-y-6">
        {QUESTIONS.map((q, idx) => {
          const activeMeta = LAYER_META[LAYER_ORDER[idx]];
          return (
          <div key={q.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div
              className={`mb-2 text-xs font-semibold uppercase tracking-widest ${activeMeta.text}`}
            >
              Layer {activeMeta.number} · {activeMeta.label}
            </div>
            <p className="mb-2 font-medium text-slate-900">{q.question}</p>
            <p className="mb-3 text-xs text-slate-500">{q.hint}</p>
            <div className="space-y-2">
              {q.options.map((optionText, index) => {
                const score = index + 1;
                const isSelected = getAnswer(q.id)?.score === score;
                return (
                  <label
                    key={index}
                    className={`flex cursor-pointer items-start gap-3 rounded border px-3 py-2.5 transition ${
                      isSelected
                        ? "border-navy-500 bg-navy-50 ring-navy-500 ring-1"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q-${q.id}`}
                      value={score}
                      checked={isSelected}
                      onChange={() => setAnswer(q.id, score)}
                      className="text-navy-600 focus:ring-navy-500 mt-1 h-4 w-4 shrink-0 border-slate-300"
                    />
                    <span className="text-sm text-slate-800">{optionText}</span>
                  </label>
                );
              })}
            </div>
          </div>
          );
        })}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!allAnswered || isPending}
          className="bg-navy-600 hover:bg-navy-500 rounded px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Complete & go to Posture Overview"}
        </button>
      </div>
    </form>
  );
}
