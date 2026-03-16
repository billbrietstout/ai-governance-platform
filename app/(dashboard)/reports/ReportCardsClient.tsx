"use client";

import { useState } from "react";
import { FileBarChart, Shield, AlertTriangle, TrendingUp, Download, Package } from "lucide-react";

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

function ReportExportButton({
  url,
  filename,
  label,
  disabled
}: {
  url: string;
  filename: string;
  label: string;
  disabled?: boolean;
}) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    if (disabled) return;
    setLoading(true);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={loading || disabled}
      className="flex items-center gap-1 rounded bg-navy-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-navy-500 disabled:opacity-50"
    >
      <Download className="h-3.5 w-3.5" />
      {loading ? "Generating…" : label}
    </button>
  );
}

export function ReportCardsClient({
  maturityLevel,
  scores,
  snapshots,
  gaps
}: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const date = new Date().toISOString().slice(0, 10);

  const reports = [
    {
      id: "audit-package",
      name: "AI Governance Audit Package",
      description: "Full audit-ready evidence package for regulators and auditors",
      icon: Package,
      exportUrl: "/api/v1/export/audit-package",
      exportFilename: `ai-posture-audit-${date}.pdf`,
      hasExport: true
    },
    {
      id: "executive",
      name: "Executive Readiness Report",
      description: "Overall governance posture for board presentations",
      icon: FileBarChart,
      exportUrl: "/api/v1/export/governance-report",
      exportFilename: `ai-posture-governance-report-${date}.pdf`,
      hasExport: true
    },
    {
      id: "board",
      name: "Board Presentation",
      description: "Slide deck for board-level AI governance briefing",
      icon: Shield,
      hasExport: false
    },
    {
      id: "gap",
      name: "Regulatory Gap Analysis",
      description: "Regulatory requirements vs. current compliance status",
      icon: AlertTriangle,
      hasExport: false
    },
    {
      id: "maturity",
      name: "Maturity Trend Report",
      description: "Maturity progression over time",
      icon: TrendingUp,
      onGenerate: () =>
        setPreview(
          `Maturity Trend Report\n\nCurrent: ${MATURITY_LABELS[maturityLevel] ?? "—"}\nScores: ${JSON.stringify(scores, null, 2)}\n\nHistorical progression and trajectory. Full trend data in Maturity Assessment.`
        ),
      hasExport: false
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
                    {r.hasExport ? (
                      <ReportExportButton
                        url={r.exportUrl!}
                        filename={r.exportFilename!}
                        label="Generate"
                      />
                    ) : (
                      <span
                        className="flex items-center gap-1 rounded border border-slate-200 px-3 py-1.5 text-xs text-slate-500"
                        title="Coming soon"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Coming soon
                      </span>
                    )}
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
