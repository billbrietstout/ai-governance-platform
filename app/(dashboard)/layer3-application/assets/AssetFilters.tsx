"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "MODEL", label: "Model" },
  { value: "PROMPT", label: "Prompt" },
  { value: "AGENT", label: "Agent" },
  { value: "DATASET", label: "Dataset" },
  { value: "APPLICATION", label: "Application" },
  { value: "TOOL", label: "Tool" },
  { value: "PIPELINE", label: "Pipeline" }
];

const EU_RISK_OPTIONS: { value: string; label: string }[] = [
  { value: "MINIMAL", label: "Minimal" },
  { value: "LIMITED", label: "Limited" },
  { value: "HIGH", label: "High" },
  { value: "UNACCEPTABLE", label: "Unacceptable" }
];

const LAYER_OPTIONS: { value: string; label: string }[] = [
  { value: "LAYER_1_BUSINESS", label: "L1 Business" },
  { value: "LAYER_2_INFORMATION", label: "L2 Information" },
  { value: "LAYER_3_APPLICATION", label: "L3 Application" },
  { value: "LAYER_4_PLATFORM", label: "L4 Platform" },
  { value: "LAYER_5_SUPPLY_CHAIN", label: "L5 Supply Chain" }
];

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "DRAFT", label: "Draft" },
  { value: "ACTIVE", label: "Active" },
  { value: "DEPRECATED", label: "Deprecated" },
  { value: "ARCHIVED", label: "Archived" }
];

export function AssetFilters() {
  const router = useRouter();
  const params = useSearchParams();

  function setFilter(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/layer3-application/assets?${next.toString()}`);
  }

  function clearAll() {
    router.push("/layer3-application/assets");
  }

  const typeVal = params.get("type") ?? "";
  const euRiskVal = params.get("euRisk") ?? "";
  const layerVal = params.get("layer") ?? "";
  const statusVal = params.get("status") ?? "";

  const hasFilters = typeVal || euRiskVal || layerVal || statusVal;

  const pill =
    "rounded-full px-3 py-1.5 text-xs font-medium transition border border-transparent";
  const inactive =
    "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50";
  const active = "border-navy-600 bg-navy-600 text-white hover:bg-navy-500";

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700">Filters</span>
        {hasFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-200 hover:text-slate-700"
          >
            <X className="h-3.5 w-3.5" />
            Clear all
          </button>
        )}
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-16 shrink-0 text-xs font-medium text-slate-500">Type</span>
          <div className="flex flex-wrap gap-1.5">
            {TYPE_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter("type", typeVal === value ? "" : value)}
                className={`${pill} ${typeVal === value ? active : inactive}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-16 shrink-0 text-xs font-medium text-slate-500">EU Risk</span>
          <div className="flex flex-wrap gap-1.5">
            {EU_RISK_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter("euRisk", euRiskVal === value ? "" : value)}
                className={`${pill} ${euRiskVal === value ? active : inactive}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-16 shrink-0 text-xs font-medium text-slate-500">Layer</span>
          <div className="flex flex-wrap gap-1.5">
            {LAYER_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter("layer", layerVal === value ? "" : value)}
                className={`${pill} ${layerVal === value ? active : inactive}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-16 shrink-0 text-xs font-medium text-slate-500">Status</span>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter("status", statusVal === value ? "" : value)}
                className={`${pill} ${statusVal === value ? active : inactive}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
