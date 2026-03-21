"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { saveVraResponse } from "@/app/(dashboard)/layer5-supply-chain/vendors/actions";
import type { VraQuestion } from "@/lib/supply-chain/vra-questions";

const ANSWER_OPTIONS = [
  { value: "YES", label: "Yes", color: "text-emerald-600" },
  { value: "NO", label: "No", color: "text-red-600" },
  { value: "PARTIAL", label: "Partial", color: "text-amber-600" },
  { value: "NA", label: "N/A", color: "text-gray-500" },
  { value: "UNKNOWN", label: "Unknown", color: "text-gray-400" }
] as const;

type ResponseRecord = {
  questionId: string;
  answer: string;
  evidenceUrl: string | null;
  notes: string | null;
  assessedAt: Date;
};

type Props = {
  vendorId: string;
  questions: VraQuestion[];
  responses: ResponseRecord[];
  vraScore: {
    score: number;
    applicableCount: number;
    answeredCount: number;
    completedCount: number;
  };
  vraStatus: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETE";
};

function groupByRiskArea(questions: VraQuestion[]) {
  const map = new Map<string, VraQuestion[]>();
  for (const q of questions) {
    const list = map.get(q.riskArea) ?? [];
    list.push(q);
    map.set(q.riskArea, list);
  }
  return map;
}

export function VraQuestionnaireSection({
  vendorId,
  questions,
  responses,
  vraScore,
  vraStatus
}: Props) {
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [localResponses, setLocalResponses] = useState<Map<string, ResponseRecord>>(() => {
    const m = new Map<string, ResponseRecord>();
    for (const r of responses) {
      m.set(r.questionId, r);
    }
    return m;
  });

  const responseMap = (qId: string) => localResponses.get(qId);
  const groups = groupByRiskArea(questions);

  const toggleArea = (area: string) => {
    setExpandedAreas((prev) => {
      const next = new Set(prev);
      if (next.has(area)) next.delete(area);
      else next.add(area);
      return next;
    });
  };

  const handleSave = async (
    questionId: string,
    answer: (typeof ANSWER_OPTIONS)[number]["value"],
    evidenceUrl?: string | null,
    notes?: string | null
  ) => {
    setPending((p) => ({ ...p, [questionId]: true }));
    try {
      await saveVraResponse(vendorId, questionId, answer, evidenceUrl, notes);
      setLocalResponses((prev) => {
        const next = new Map(prev);
        next.set(questionId, {
          questionId,
          answer,
          evidenceUrl: evidenceUrl ?? null,
          notes: notes ?? null,
          assessedAt: new Date()
        });
        return next;
      });
    } finally {
      setPending((p) => ({ ...p, [questionId]: false }));
    }
  };

  const statusBadge =
    vraStatus === "COMPLETE" ? (
      <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
        Complete
      </span>
    ) : vraStatus === "IN_PROGRESS" ? (
      <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
        In progress
      </span>
    ) : (
      <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
        Not started
      </span>
    );

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-medium text-gray-900">VRA Security Questionnaire</h2>
        <div className="flex items-center gap-3">
          {statusBadge}
          <span className="text-sm text-gray-600">
            {vraScore.applicableCount > 0
              ? `${vraScore.answeredCount}/${vraScore.applicableCount} answered · ${Math.round(vraScore.score * 100)}% score`
              : "No applicable questions"}
          </span>
        </div>
      </div>

      {questions.length === 0 ? (
        <p className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600 shadow-sm">
          Set a vendor type to see applicable VRA questions.
        </p>
      ) : (
        <div className="space-y-2 rounded-lg border border-gray-200 bg-white shadow-sm">
          {Array.from(groups.entries()).map(([riskArea, qs]) => {
            const isExpanded = expandedAreas.has(riskArea);
            const areaAnswered = qs.filter((q) => responseMap(q.id)).length;
            const areaTotal = qs.length;

            return (
              <div key={riskArea} className="border-b border-gray-100 last:border-b-0">
                <button
                  type="button"
                  onClick={() => toggleArea(riskArea)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-gray-50"
                >
                  <span className="flex items-center gap-2 font-medium text-gray-900">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    )}
                    {riskArea}
                  </span>
                  <span className="text-sm text-gray-500">
                    {areaAnswered}/{areaTotal}
                  </span>
                </button>

                {isExpanded && (
                  <div className="space-y-4 border-t border-gray-100 bg-gray-50/50 px-4 py-4">
                    {qs.map((q) => {
                      const resp = responseMap(q.id);
                      return (
                        <QuestionRow
                          key={q.id}
                          question={q}
                          response={resp}
                          onSave={handleSave}
                          pending={pending[q.id]}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

const VRA_ANSWER = ["YES", "NO", "NA", "PARTIAL", "UNKNOWN"] as const;
type VraAnswerValue = (typeof VRA_ANSWER)[number];

function QuestionRow({
  question,
  response,
  onSave,
  pending
}: {
  question: VraQuestion;
  response?: ResponseRecord;
  onSave: (
    qId: string,
    answer: VraAnswerValue,
    evidenceUrl?: string | null,
    notes?: string | null
  ) => void;
  pending: boolean;
}) {
  const [answer, setAnswer] = useState(response?.answer ?? "");
  const [evidenceUrl, setEvidenceUrl] = useState(response?.evidenceUrl ?? "");
  const [notes, setNotes] = useState(response?.notes ?? "");
  const [showForm, setShowForm] = useState(false);

  const hasChanges =
    answer !== (response?.answer ?? "") ||
    evidenceUrl !== (response?.evidenceUrl ?? "") ||
    notes !== (response?.notes ?? "");

  const handleSave = () => {
    const ans = (answer || response?.answer || "UNKNOWN") as VraAnswerValue;
    onSave(question.id, ans, evidenceUrl || null, notes || null);
    setShowForm(false);
  };

  return (
    <div className="rounded border border-gray-200 bg-white p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900">{question.text}</p>
          {question.attestation && (
            <p className="mt-1 text-xs text-gray-500">{question.attestation}</p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {ANSWER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setAnswer(opt.value);
                if (!response || response.answer !== opt.value) {
                  onSave(question.id, opt.value, evidenceUrl || null, notes || null);
                }
              }}
              disabled={pending}
              className={`rounded px-2 py-1 text-xs font-medium transition ${
                answer === opt.value
                  ? "bg-navy-100 text-navy-700 ring-navy-300 ring-1"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-2">
        <button
          type="button"
          onClick={() => setShowForm((s) => !s)}
          className="text-navy-600 text-xs hover:underline"
        >
          {showForm ? "Hide" : "Add"} evidence link / notes
        </button>
        {showForm && (
          <div className="mt-2 space-y-2">
            <input
              type="url"
              placeholder="Evidence URL"
              value={evidenceUrl}
              onChange={(e) => setEvidenceUrl(e.target.value)}
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
            />
            <input
              type="text"
              placeholder="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
            />
            {hasChanges && (
              <button
                type="button"
                onClick={handleSave}
                disabled={pending}
                className="bg-navy-600 hover:bg-navy-700 flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-white disabled:opacity-50"
              >
                {pending ? "Saving…" : "Save"}
              </button>
            )}
          </div>
        )}
      </div>

      {response?.evidenceUrl && (
        <a
          href={response.evidenceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-navy-600 mt-2 block text-xs hover:underline"
        >
          {response.evidenceUrl}
        </a>
      )}
      {response?.notes && !showForm && (
        <p className="mt-1 text-xs text-gray-600">{response.notes}</p>
      )}
    </div>
  );
}
