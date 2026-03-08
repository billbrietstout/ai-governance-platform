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

export function LayerPosturePanel({ layers, layerLinks }: Props) {
  return (
    <div className="rounded-lg border border-slatePro-700 bg-slatePro-900/30 p-4">
      <h3 className="mb-3 text-sm font-medium text-slatePro-300">Five-Layer Posture</h3>
      <div className="space-y-2">
        {layers.map((l) => {
          const href = layerLinks[l.layer];
          const label = LAYER_LABELS[l.layer] ?? l.layer;
          const color =
            l.compliancePct >= 80 ? "bg-emerald-500/20" : l.compliancePct >= 50 ? "bg-amber-500/20" : "bg-red-500/20";

          const content = (
            <div className="flex items-center justify-between rounded border border-slatePro-700 px-3 py-2">
              <div>
                <span className="font-medium text-slatePro-200">{label}</span>
                <span className={`ml-2 rounded px-2 py-0.5 text-xs ${color}`}>{l.compliancePct}%</span>
              </div>
              <div className="flex gap-4 text-sm text-slatePro-500">
                <span>{l.riskCount} risks</span>
                <span>{l.accountableOwner ?? "—"}</span>
                <span>{l.lastReviewed ? new Date(l.lastReviewed).toLocaleDateString() : "—"}</span>
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
              <span className="ml-2 text-xs text-slatePro-500">(Available via module)</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
