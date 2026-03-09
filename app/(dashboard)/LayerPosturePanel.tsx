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

const LAYER_BORDER_COLORS: Record<string, string> = {
  LAYER_1_BUSINESS: "border-l-indigo-500",
  LAYER_2_INFORMATION: "border-l-blue-500",
  LAYER_3_APPLICATION: "border-l-cyan-500",
  LAYER_4_PLATFORM: "border-l-teal-500",
  LAYER_5_SUPPLY_CHAIN: "border-l-emerald-500"
};

export function LayerPosturePanel({ layers, layerLinks }: Props) {
  return (
    <div className="rounded-lg border border-slatePro-700 bg-slatePro-900/30 p-4">
      <h3 className="mb-3 text-sm font-medium text-slatePro-300">Five-Layer Posture</h3>
      <div className="space-y-2">
        {layers.map((l) => {
          const href = layerLinks[l.layer];
          const label = LAYER_LABELS[l.layer] ?? l.layer;
          const borderColor = LAYER_BORDER_COLORS[l.layer] ?? "border-l-slatePro-600";
          const riskBadgeColor = l.riskCount > 0 ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400";

          const content = (
            <div className={`flex items-center justify-between rounded border border-slatePro-700 border-l-4 ${borderColor} bg-slatePro-900/50 px-3 py-2`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slatePro-200">{label}</span>
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${riskBadgeColor}`}>
                    {l.riskCount} risks
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-24 overflow-hidden rounded-full bg-slatePro-700">
                  <div
                    className={`h-full rounded-full ${
                      l.compliancePct >= 80 ? "bg-emerald-500" : l.compliancePct >= 50 ? "bg-amber-500" : "bg-red-500"
                    }`}
                    style={{ width: `${l.compliancePct}%` }}
                  />
                </div>
              </div>
              <div className="ml-4 shrink-0 text-right text-xs text-slatePro-500">
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
              <span className="ml-2 shrink-0 text-xs text-slatePro-500">(Available via module)</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
