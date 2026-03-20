"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Circle, Loader2 } from "lucide-react";
import { updateClauseStatus } from "./actions";

type Clause = {
  id: string;
  label: string;
  evidenceLink: string;
  status: string;
  notes: string | null;
};
type Group = { title: string; clauses: Clause[] };

type Props = { initialScore: number; groups: Group[] };

function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-600";
  if (score >= 50) return "text-amber-600";
  return "text-red-600";
}

export function ISO42001Client({ initialScore, groups }: Props) {
  const router = useRouter();
  const [clauses, setClauses] = useState<Record<string, Clause>>(() => {
    const m: Record<string, Clause> = {};
    for (const g of groups) {
      for (const c of g.clauses) m[c.id] = c;
    }
    return m;
  });
  const [updating, setUpdating] = useState<string | null>(null);

  const completeCount = Object.values(clauses).filter((c) => c.status === "COMPLETE").length;
  const totalCount = Object.keys(clauses).length;
  const displayScore = totalCount > 0 ? Math.round((completeCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Readiness score ring */}
      <div className="flex items-center gap-8 rounded-lg border border-slate-200 bg-white p-6">
        <div className="relative h-24 w-24">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="2"
            />
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke={displayScore >= 80 ? "#10b981" : displayScore >= 50 ? "#f59e0b" : "#ef4444"}
              strokeWidth="2"
              strokeDasharray={`${displayScore}, 100`}
              strokeLinecap="round"
              className="transition-all"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-xl font-bold ${scoreColor(displayScore)}`}>{displayScore}%</span>
          </div>
        </div>
        <div>
          <h3 className="font-medium text-slate-900">Overall Readiness</h3>
          <p className="mt-1 text-sm text-slate-600">
            {completeCount} of {totalCount} clauses addressed
          </p>
        </div>
      </div>

      {/* Clause groups */}
      <div className="space-y-6">
        {groups.map((group) => (
          <div key={group.title} className="rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="mb-4 text-sm font-semibold text-slate-800">{group.title}</h3>
            <ul className="space-y-3">
              {group.clauses.map((c) => {
                const status = clauses[c.id]?.status ?? c.status;
                const isComplete = status === "COMPLETE";
                const isUpdating = updating === c.id;
                return (
                  <li
                    key={c.id}
                    className="flex items-center justify-between gap-4 rounded border border-slate-100 bg-slate-50/50 px-4 py-3"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <button
                        type="button"
                        onClick={async () => {
                          setUpdating(c.id);
                          try {
                            await updateClauseStatus({
                              clauseId: c.id,
                              status: isComplete ? "NOT_STARTED" : "COMPLETE"
                            });
                            setClauses((prev) => ({
                              ...prev,
                              [c.id]: {
                                ...prev[c.id]!,
                                status: isComplete ? "NOT_STARTED" : "COMPLETE"
                              }
                            }));
                            router.refresh();
                          } finally {
                            setUpdating(null);
                          }
                        }}
                        disabled={isUpdating}
                        className="shrink-0 rounded p-1 hover:bg-slate-200"
                        title={isComplete ? "Mark incomplete" : "Mark complete"}
                      >
                        {isUpdating ? (
                          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                        ) : isComplete ? (
                          <Check className="h-5 w-5 text-emerald-600" />
                        ) : (
                          <Circle className="h-5 w-5 text-slate-400" />
                        )}
                      </button>
                      <div>
                        <span className="font-medium text-slate-900">
                          {c.id} — {c.label}
                        </span>
                        <Link
                          href={c.evidenceLink}
                          className="text-navy-600 ml-2 text-xs hover:underline"
                        >
                          Evidence →
                        </Link>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${
                        status === "COMPLETE"
                          ? "bg-emerald-100 text-emerald-700"
                          : status === "IN_PROGRESS"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {status.replace("_", " ")}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
