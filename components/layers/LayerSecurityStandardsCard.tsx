"use client";

import { Shield, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import {
  getLayerSecurityProfile,
  type CosaiLayer
} from "@/lib/security-frameworks";

const LAYER_LABELS: Record<string, string> = {
  LAYER_1_BUSINESS: "L1 Business",
  LAYER_2_INFORMATION: "L2 Information",
  LAYER_3_APPLICATION: "L3 Application",
  LAYER_4_PLATFORM: "L4 Platform",
  LAYER_5_SUPPLY_CHAIN: "L5 Supply Chain"
};

type Props = {
  layer: CosaiLayer;
};

export function LayerSecurityStandardsCard({ layer }: Props) {
  const [expanded, setExpanded] = useState(false);
  const profile = getLayerSecurityProfile(layer);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-navy-600" />
          <h3 className="font-medium text-slate-900">AI Security Standards</h3>
          <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            {LAYER_LABELS[layer] ?? layer}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-slate-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-500" />
        )}
      </button>
      <p className="mt-1 text-sm text-slate-600">{profile.focus}</p>

      {expanded && (
        <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">
          {profile.categories.map((cat) => (
            <div key={cat.id}>
              <h4 className="text-sm font-medium text-slate-800">{cat.title}</h4>
              <p className="mt-0.5 text-xs text-slate-500">{cat.description}</p>
              <ul className="mt-2 space-y-1 pl-4 text-sm text-slate-700">
                {cat.keyControls.map((ctrl, i) => (
                  <li key={i} className="list-disc">
                    {ctrl}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wide text-slate-500">
              References
            </h4>
            <div className="mt-1 flex flex-wrap gap-2">
              {profile.references.map((ref) => (
                <span
                  key={ref.standard}
                  className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700"
                >
                  {ref.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
