"use client";

import { useRouter, useSearchParams } from "next/navigation";

const LAYERS = [
  "LAYER_1_BUSINESS",
  "LAYER_2_INFORMATION",
  "LAYER_3_APPLICATION",
  "LAYER_4_PLATFORM",
  "LAYER_5_SUPPLY_CHAIN"
];

export function AccountabilityFilters() {
  const router = useRouter();
  const params = useSearchParams();

  function setLayer(value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set("layer", value);
    else next.delete("layer");
    router.push(`/layer3-application/accountability?${next.toString()}`);
  }

  return (
    <div className="flex gap-4 rounded-lg border border-slatePro-700 bg-slatePro-900/30 p-4">
      <select
        value={params.get("layer") ?? ""}
        onChange={(e) => setLayer(e.target.value)}
        className="rounded border border-slatePro-600 bg-slatePro-900 px-2 py-1 text-sm text-slatePro-200"
      >
        <option value="">All layers</option>
        {LAYERS.map((l) => (
          <option key={l} value={l}>{l.replace("LAYER_", "L")}</option>
        ))}
      </select>
    </div>
  );
}
