"use client";

import Link from "next/link";

type Layer = {
  layer: string;
  compliancePct: number;
  riskCount: number;
  accountableOwner: string | null;
  lastReviewed: Date | null;
};

type Props = {
  layers: Layer[];
  layerLinks: Record<string, string>;
};

const LAYER_LABELS: Record<string, string> = {
  LAYER_1_BUSINESS: "Layer 1: Business",
  LAYER_2_INFORMATION: "Layer 2: Information",
  LAYER_3_APPLICATION: "Layer 3: Application",
  LAYER_4_PLATFORM: "Layer 4: Platform",
  LAYER_5_SUPPLY_CHAIN: "Layer 5: Supply Chain"
};

function scoreColor(pct: number): { bar: string; border: string } {
  if (pct <= 30) return { bar: "bg-red-500", border: "border-l-red-500" };
  if (pct <= 60) return { bar: "bg-amber-500", border: "border-l-amber-500" };
  if (pct <= 80) return { bar: "bg-blue-500", border: "border-l-blue-500" };
  return { bar: "bg-emerald-500", border: "border-l-emerald-500" };
}

export function LayerPosturePanel({ layers, layerLinks }: Props) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-medium text-slate-700">Five-Layer Posture</h3>
      <div className="space-y-2">
        {layers.map((l) => {
          const href = layerLinks[l.layer];
          const label = LAYER_LABELS[l.layer] ?? l.layer;
          const { bar, border } = scoreColor(l.compliancePct);
          const riskBadgeColor = l.riskCount > 0 ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-500";

          const content = (
            <div className={`flex items-center justify-between rounded border border-slate-200 border-l-4 ${border} bg-slate-50 px-3 py-2`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-900">{label}</span>
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${riskBadgeColor}`}>
                    {l.riskCount} risks
                  </span>
                </div>
                <div className="mt-1.5 h-2 w-24 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full ${bar}`}
                    style={{ width: `${l.compliancePct}%` }}
                  />
                </div>
              </div>
              <div className="ml-4 shrink-0 text-right text-xs text-slate-500">
                <div>{l.accountableOwner ?? "—"}</div>
                <div>{l.lastReviewed ? new Date(l.lastReviewed).toLocaleDateString() : "—"}</div>
              </div>
            </div>
          );

          return href ? (
            <Link key={l.layer} href={href} className="block transition hover:opacity-90">
              {content}
            </Link>
          ) : (
            <div key={l.layer} className="flex items-center opacity-75">
              {content}
              <span className="ml-2 shrink-0 text-xs text-slate-500">(Available via module)</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
