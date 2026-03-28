"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileDown, Check, X, Minus } from "lucide-react";
import { getEvidenceWorkbook, getEvidenceCompleteness } from "./actions";

type CosaiLayer = "L1" | "L2" | "L3" | "L4" | "L5";

type WorkbookItem = {
  id: string;
  layer: string;
  name: string;
  category: string;
  requiredFor: string[];
  howToCollect: string;
  prismaModel: string;
  status: "present" | "missing" | "partial";
  count: number;
  lastUpdated: Date | null;
  link: string;
};

type Completeness = {
  byLayer: Record<string, { complete: number; total: number; pct: number }>;
  overallPct: number;
  totalComplete: number;
  totalItems: number;
};

const LAYER_LABELS: Record<CosaiLayer, string> = {
  L1: "L1 Business",
  L2: "L2 Information",
  L3: "L3 Application",
  L4: "L4 Platform",
  L5: "L5 Supply Chain"
};

const CATEGORY_COLORS: Record<string, string> = {
  Oversight: "bg-slate-100 text-slate-700",
  Technical: "bg-blue-100 text-blue-700",
  Operational: "bg-amber-100 text-amber-700",
  Assessment: "bg-purple-100 text-purple-700",
  Attestation: "bg-emerald-100 text-emerald-700"
};

function StatusIcon({ status }: { status: string }) {
  if (status === "present") return <Check className="h-4 w-4 text-emerald-600" />;
  if (status === "partial") return <Minus className="h-4 w-4 text-amber-600" />;
  return <X className="h-4 w-4 text-red-600" />;
}

export function EvidenceWorkbookClient() {
  const [layer, setLayer] = useState<CosaiLayer>("L1");
  const [items, setItems] = useState<WorkbookItem[]>([]);
  const [completeness, setCompleteness] = useState<Completeness | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([getEvidenceWorkbook(layer), getEvidenceCompleteness()])
      .then(([workbookData, completenessData]) => {
        if (cancelled) return;
        setItems(workbookData as WorkbookItem[]);
        setCompleteness(completenessData as Completeness);
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [layer]);

  const handleExport = async () => {
    const allItems = await Promise.all(
      (["L1", "L2", "L3", "L4", "L5"] as CosaiLayer[]).map((l) => getEvidenceWorkbook(l))
    );
    const flat = allItems.flat();
    const blob = new Blob([JSON.stringify(flat, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `evidence-workbook-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      {completeness && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap gap-4">
            {(["L1", "L2", "L3", "L4", "L5"] as CosaiLayer[]).map((l) => {
              const d = completeness.byLayer[l];
              if (!d) return null;
              return (
                <div key={l} className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-700">{l}:</span>
                  <span className="text-sm text-slate-600">
                    {d.complete} / {d.total}
                  </span>
                  <span
                    className={`text-xs font-medium ${d.pct >= 80 ? "text-emerald-600" : d.pct >= 50 ? "text-amber-600" : "text-red-600"}`}
                  >
                    ({d.pct}%)
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded bg-slate-100 px-3 py-1.5">
              <span className="text-sm font-medium text-slate-700">Overall: </span>
              <span
                className={`font-bold ${completeness.overallPct >= 80 ? "text-emerald-600" : completeness.overallPct >= 50 ? "text-amber-600" : "text-red-600"}`}
              >
                {completeness.overallPct}%
              </span>
              <span className="text-sm text-slate-600">
                {" "}
                ({completeness.totalComplete} / {completeness.totalItems} items)
              </span>
            </div>
            <button
              type="button"
              onClick={handleExport}
              className="bg-navy-600 hover:bg-navy-500 flex items-center gap-2 rounded px-4 py-2 text-sm font-medium text-white"
            >
              <FileDown className="h-4 w-4" />
              Export workbook
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {(["L1", "L2", "L3", "L4", "L5"] as CosaiLayer[]).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLayer(l)}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
              layer === l
                ? "border-navy-500 text-navy-600"
                : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900"
            }`}
          >
            {LAYER_LABELS[l]}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-500">
          Loading…
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Evidence item
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Required for
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Last updated
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{item.name}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[item.category] ?? "bg-slate-100 text-slate-700"}`}
                    >
                      {item.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {item.requiredFor.join(", ")}
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5">
                      <StatusIcon status={item.status} />
                      <span className="text-sm">
                        {item.status === "present"
                          ? "Present"
                          : item.status === "partial"
                            ? "Partial"
                            : "Missing"}
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {item.lastUpdated ? new Date(item.lastUpdated).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {item.status === "missing" ? (
                      <Link
                        href={item.link}
                        className="text-navy-600 text-sm font-medium hover:underline"
                      >
                        Add evidence →
                      </Link>
                    ) : (
                      <Link
                        href={item.link}
                        className="text-sm text-slate-500 hover:text-slate-700"
                      >
                        View source
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
