"use client";

import { useState } from "react";
import { FileBarChart, Shield, AlertTriangle, TrendingUp, Download } from "lucide-react";

const MATURITY_LABELS: Record<number, string> = {
  1: "M1 Aware",
  2: "M2 Documented",
  3: "M3 Implemented",
  4: "M4 Measured",
  5: "M5 Optimised"
};

type Props = {
  maturityLevel: number;
  scores: Record<string, number>;
  snapshots: unknown[];
  gaps: unknown[];
};

export function ReportCardsClient({
  maturityLevel,
  scores,
  snapshots,
  gaps
}: Props) {
  const [preview, setPreview] = useState<string | null>(null);

  const reports = [
    {
      id: "executive",
      name: "Executive Summary",
      description: "Overall governance posture for board presentations",
      icon: FileBarChart,
      onGenerate: () =>
        setPreview(
          `Executive Summary\n\nMaturity Level: ${MATURITY_LABELS[maturityLevel] ?? "—"}\nLayer Scores: L1 ${(scores.L1 ?? 0).toFixed(1)}, L2 ${(scores.L2 ?? 0).toFixed(1)}, L3 ${(scores.L3 ?? 0).toFixed(1)}, L4 ${(scores.L4 ?? 0).toFixed(1)}, L5 ${(scores.L5 ?? 0).toFixed(1)}\n\nKey metrics from platform data. Full report available on export.`
        )
    },
    {
      id: "compliance",
      name: "Compliance Status",
      description: "Framework-by-framework compliance scores",
      icon: Shield,
      onGenerate: () =>
        setPreview(
          `Compliance Status\n\nSnapshots: ${snapshots.length} on record\nFrameworks: EU AI Act, NIST AI RMF, ISO 42001\n\nPer-framework scores and layer breakdown. Generate snapshots in Compliance to populate.`
        )
    },
    {
      id: "gap",
      name: "Gap Analysis Report",
      description: "All gaps with owners and timelines",
      icon: AlertTriangle,
      onGenerate: () =>
        setPreview(
          `Gap Analysis Report\n\nOpen gaps: ${Array.isArray(gaps) ? gaps.length : 0}\n\nEach gap includes: description, owner, due date, priority. View full details in Gap Analysis.`
        )
    },
    {
      id: "maturity",
      name: "Maturity Trend Report",
      description: "Maturity progression over time",
      icon: TrendingUp,
      onGenerate: () =>
        setPreview(
          `Maturity Trend Report\n\nCurrent: ${MATURITY_LABELS[maturityLevel] ?? "—"}\nScores: ${JSON.stringify(scores, null, 2)}\n\nHistorical progression and trajectory. Full trend data in Maturity Assessment.`
        )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {reports.map((r) => {
          const Icon = r.icon;
          return (
            <div
              key={r.id}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-navy-100 p-2">
                  <Icon className="h-5 w-5 text-navy-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-slate-900">{r.name}</h3>
                  <p className="mt-1 text-sm text-slate-600">{r.description}</p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={r.onGenerate}
                      className="rounded bg-navy-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-navy-500"
                    >
                      Generate
                    </button>
                    <span className="flex items-center gap-1 rounded border border-slate-200 px-3 py-1.5 text-xs text-slate-500">
                      <Download className="h-3.5 w-3.5" />
                      Export as PDF — Coming soon
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {preview && (
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h3 className="font-medium text-slate-900">Report preview</h3>
          <pre className="mt-3 whitespace-pre-wrap rounded bg-slate-50 p-4 text-sm text-slate-700">
            {preview}
          </pre>
          <button
            type="button"
            onClick={() => setPreview(null)}
            className="mt-3 text-sm text-navy-600 hover:underline"
          >
            Close preview
          </button>
        </div>
      )}
    </div>
  );
}
