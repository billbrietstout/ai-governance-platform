"use client";

import { useRouter, useSearchParams } from "next/navigation";

const TYPES = ["MODEL", "PROMPT", "AGENT", "DATASET", "APPLICATION", "TOOL", "PIPELINE"];
const EU_RISKS = ["MINIMAL", "LIMITED", "HIGH", "UNACCEPTABLE"];
const LAYERS = ["LAYER_1_BUSINESS", "LAYER_2_INFORMATION", "LAYER_3_APPLICATION", "LAYER_4_PLATFORM", "LAYER_5_SUPPLY_CHAIN"];
const STATUSES = ["DRAFT", "ACTIVE", "DEPRECATED", "ARCHIVED"];

export function AssetFilters() {
  const router = useRouter();
  const params = useSearchParams();

  function setFilter(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/layer3-application/assets?${next.toString()}`);
  }

  const typeVal = params.get("type") ?? "";
  const euRiskVal = params.get("euRisk") ?? "";
  const layerVal = params.get("layer") ?? "";
  const statusVal = params.get("status") ?? "";

  const pill = "rounded-full px-3 py-1 text-xs font-medium transition";
  const inactive = "bg-slatePro-800 text-slatePro-400 hover:bg-slatePro-700 hover:text-slatePro-200";
  const active = "bg-navy-600 text-white";

  return (
    <div className="flex flex-wrap gap-2">
      <span className="text-xs font-medium text-slatePro-500">Type:</span>
      {TYPES.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => setFilter("type", typeVal === t ? "" : t)}
          className={`${pill} ${typeVal === t ? active : inactive}`}
        >
          {t}
        </button>
      ))}
      <span className="ml-2 text-xs font-medium text-slatePro-500">EU Risk:</span>
      {EU_RISKS.map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => setFilter("euRisk", euRiskVal === r ? "" : r)}
          className={`${pill} ${euRiskVal === r ? active : inactive}`}
        >
          {r}
        </button>
      ))}
      <span className="ml-2 text-xs font-medium text-slatePro-500">Layer:</span>
      {LAYERS.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setFilter("layer", layerVal === l ? "" : l)}
          className={`${pill} ${layerVal === l ? active : inactive}`}
        >
          {l.replace("LAYER_", "L")}
        </button>
      ))}
      <span className="ml-2 text-xs font-medium text-slatePro-500">Status:</span>
      {STATUSES.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => setFilter("status", statusVal === s ? "" : s)}
          className={`${pill} ${statusVal === s ? active : inactive}`}
        >
          {s}
        </button>
      ))}
    </div>
  );
}
