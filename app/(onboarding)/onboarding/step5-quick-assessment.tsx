"use client";

import { useState } from "react";
import {
  MATURITY_QUESTIONS,
  LAYER_LABELS,
  MATURITY_LEVEL_LABELS
} from "@/lib/maturity/questions";
import { QUICK_MATURITY_QUESTION_IDS } from "@/lib/onboarding/steps";
import { scoreAssessment, getMaturityLevel } from "@/lib/maturity/scoring";
import { saveStep5 } from "./actions";

const QUESTIONS = QUICK_MATURITY_QUESTION_IDS.map((id) =>
  MATURITY_QUESTIONS.find((q) => q.id === id)
).filter(Boolean) as typeof MATURITY_QUESTIONS;

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
        <h3 className="text-lg font-semibold text-emerald-800">
          You&apos;re ready to start
        </h3>
        <p className="mt-2 text-emerald-700">
          Your baseline readiness score is{" "}
          <span className="font-bold">{MATURITY_LEVEL_LABELS[resultLevel]}</span>
          .
        </p>
        <button
          type="button"
          onClick={() => onComplete()}
          className="mt-4 rounded bg-navy-600 px-4 py-2 text-sm font-medium text-white hover:bg-navy-500"
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

      <div className="space-y-6">
        {QUESTIONS.map((q) => (
          <div
            key={q.id}
            className="rounded-lg border border-slate-200 bg-slate-50 p-4"
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded bg-navy-100 px-2 py-0.5 text-xs font-medium text-navy-700">
                {LAYER_LABELS[q.layer]}
              </span>
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
                        ? "border-navy-500 bg-navy-50 ring-1 ring-navy-500"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q-${q.id}`}
                      value={score}
                      checked={isSelected}
                      onChange={() => setAnswer(q.id, score)}
                      className="mt-1 h-4 w-4 shrink-0 border-slate-300 text-navy-600 focus:ring-navy-500"
                    />
                    <span className="text-sm text-slate-800">{optionText}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!allAnswered || isPending}
          className="rounded bg-navy-600 px-4 py-2 text-sm font-medium text-white hover:bg-navy-500 disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Complete & go to Posture Overview"}
        </button>
      </div>
    </form>
  );
}
