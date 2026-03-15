"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LAYER_LABELS, MATURITY_QUESTIONS } from "@/lib/maturity/questions";
import type { MaturityLayer } from "@/lib/maturity/questions";
import { submitMaturityAssessment } from "./actions";

type AnswerState = { questionId: string; answer: number; score: number };

type Props = {
  latestAssessment: {
    id: string;
    answers: AnswerState[];
    maturityLevel: number;
    assessedBy: string;
    createdAt: Date;
  } | null;
  lastAssessedAt: Date | null;
  currentScores: Record<string, number>;
};

const LAYERS: MaturityLayer[] = ["L1", "L2", "L3", "L4", "L5"];

export function MaturityAssessmentClient({
  latestAssessment,
  lastAssessedAt
}: Props) {
  const router = useRouter();
  const [activeLayer, setActiveLayer] = useState<MaturityLayer>("L1");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerState[]>(
    latestAssessment?.answers ?? []
  );
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const layerQuestions = MATURITY_QUESTIONS.filter((q) => q.layer === activeLayer);
  const currentQ = layerQuestions[questionIndex];
  const hasNextInLayer = questionIndex < layerQuestions.length - 1;
  const hasPrev = questionIndex > 0;

  const isLastQuestionOverall = currentQ?.id === "L5-5";
  const currentLayerIndex = LAYERS.indexOf(activeLayer);
  const hasNextLayer = currentLayerIndex >= 0 && currentLayerIndex < LAYERS.length - 1;

  const advanceToNext = () => {
    if (hasNextInLayer) {
      setQuestionIndex((i) => i + 1);
    } else if (hasNextLayer) {
      setActiveLayer(LAYERS[currentLayerIndex + 1]!);
      setQuestionIndex(0);
    }
  };

  const getAnswer = (qId: string) => answers.find((a) => a.questionId === qId);

  const setAnswer = (questionId: string, score: number) => {
    setAnswers((prev) => {
      const rest = prev.filter((a) => a.questionId !== questionId);
      return [...rest, { questionId, answer: score, score }];
    });
  };

  const allQuestions = MATURITY_QUESTIONS;
  const answeredCount = allQuestions.filter((q) => getAnswer(q.id)).length;
  const totalCount = allQuestions.length;

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      const toSubmit = allQuestions.map((q) => {
        const a = getAnswer(q.id);
        return {
          questionId: q.id,
          answer: a?.answer ?? 1,
          score: a?.score ?? 1
        };
      });
      await submitMaturityAssessment(toSubmit, notes || undefined);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit");
    } finally {
      setIsSubmitting(false);
    }
  };

  const [daysAgo, setDaysAgo] = useState<number | null>(null);
  useEffect(() => {
    if (lastAssessedAt) {
      setDaysAgo(
        Math.floor(
          (Date.now() - new Date(lastAssessedAt).getTime()) / (24 * 60 * 60 * 1000)
        )
      );
    }
  }, [lastAssessedAt]);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-medium text-slate-700">Assessment Questionnaire</h2>

      {!latestAssessment ? (
        <p className="mb-4 text-sm text-slate-600">
          Complete the assessment to establish your baseline maturity score.
        </p>
      ) : (
        <p className="mb-4 text-sm text-slate-600" suppressHydrationWarning>
          Last assessed {daysAgo !== null ? `${daysAgo} days ago` : "recently"} by{" "}
          {latestAssessment.assessedBy}. Retake to update your score.
        </p>
      )}

      {/* Layer tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {LAYERS.map((layer) => (
          <button
            key={layer}
            type="button"
            onClick={() => {
              setActiveLayer(layer);
              setQuestionIndex(0);
            }}
            className={`rounded px-3 py-1.5 text-sm font-medium ${
              activeLayer === layer
                ? "bg-navy-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {LAYER_LABELS[layer]}
          </button>
        ))}
      </div>

      {/* One question at a time per layer */}
      {currentQ && (
        <div className="mb-4 rounded border border-slate-200 bg-slate-50 p-4">
          <p className="mb-2 font-medium text-slate-900">{currentQ.question}</p>
          <p className="mb-3 text-xs text-slate-500">{currentQ.hint}</p>
          <div className="space-y-2">
            {currentQ.options.map((optionText, index) => {
              const score = index + 1;
              const isSelected = getAnswer(currentQ.id)?.score === score;
              return (
                <label
                  key={index}
                  className={`flex cursor-pointer items-start gap-3 rounded border px-3 py-2.5 transition ${
                    isSelected
                      ? "border-navy-500 bg-navy-50 ring-1 ring-navy-500"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name={`q-${currentQ.id}`}
                    value={score}
                    checked={isSelected}
                    onChange={() => {
                      setAnswer(currentQ.id, score);
                      if (!isLastQuestionOverall) advanceToNext();
                    }}
                    className="mt-1 h-4 w-4 shrink-0 border-slate-300 text-navy-600 focus:ring-navy-500"
                  />
                  <span className="text-sm text-slate-800">{optionText}</span>
                </label>
              );
            })}
          </div>
          {isLastQuestionOverall && getAnswer(currentQ.id) && (
            <div className="mt-4">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full rounded-lg bg-navy-600 px-4 py-3 text-base font-semibold text-white hover:bg-navy-500 disabled:opacity-50"
              >
                {isSubmitting ? "Submitting…" : "Submit Assessment"}
              </button>
              <p className="mt-2 text-center text-xs text-slate-500">
                All 25 questions answered. Submit to save your assessment.
              </p>
            </div>
          )}
          <div className="mt-2 flex gap-2">
            {hasPrev && (
              <button
                type="button"
                onClick={() => setQuestionIndex((i) => i - 1)}
                className="text-sm text-navy-600 hover:underline"
              >
                ← Previous
              </button>
            )}
            {hasNextInLayer && (
              <button
                type="button"
                onClick={() => setQuestionIndex((i) => i + 1)}
                className="text-sm text-navy-600 hover:underline"
              >
                Next →
              </button>
            )}
            {!hasNextInLayer && hasNextLayer && (
              <button
                type="button"
                onClick={() => {
                  setActiveLayer(LAYERS[currentLayerIndex + 1]!);
                  setQuestionIndex(0);
                }}
                className="text-sm text-navy-600 hover:underline"
              >
                Next layer →
              </button>
            )}
          </div>
        </div>
      )}

      <p className="mb-3 text-xs text-slate-500">
        Progress: {answeredCount} / {totalCount} questions answered
      </p>

      <div className="mb-4">
        <label htmlFor="notes" className="block text-xs font-medium text-slate-600">
          Notes (optional)
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900"
          rows={2}
          placeholder="Add context for this assessment..."
        />
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="rounded bg-navy-600 px-4 py-2 text-sm font-medium text-white hover:bg-navy-500 disabled:opacity-50"
      >
        {isSubmitting ? "Submitting…" : "Submit Assessment"}
      </button>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
