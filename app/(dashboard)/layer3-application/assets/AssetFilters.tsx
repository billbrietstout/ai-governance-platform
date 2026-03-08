"use client";

import { useRouter, useSearchParams } from "next/navigation";

const TYPES = ["MODEL", "PROMPT", "AGENT", "DATASET", "APPLICATION", "TOOL", "PIPELINE"];
const EU_RISKS = ["MINIMAL", "LIMITED", "HIGH", "UNACCEPTABLE"];
const LAYERS = ["LAYER_1_BUSINESS", "LAYER_2_INFORMATION", "LAYER_3_APPLICATION", "LAYER_4_PLATFORM", "LAYER_5_SUPPLY_CHAIN"];
const VERTICALS = ["GENERAL", "HEALTHCARE", "FINANCIAL", "AUTOMOTIVE", "RETAIL", "MANUFACTURING", "PUBLIC_SECTOR"];
const OPERATING = ["IN_HOUSE", "VENDOR", "HYBRID"];
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

  return (
    <div className="flex flex-wrap gap-4 rounded-lg border border-slatePro-700 bg-slatePro-900/30 p-4">
      <select
        value={params.get("type") ?? ""}
        onChange={(e) => setFilter("type", e.target.value)}
        className="rounded border border-slatePro-600 bg-slatePro-900 px-2 py-1 text-sm text-slatePro-200"
      >
        <option value="">All types</option>
        {TYPES.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
      <select
        value={params.get("euRisk") ?? ""}
        onChange={(e) => setFilter("euRisk", e.target.value)}
        className="rounded border border-slatePro-600 bg-slatePro-900 px-2 py-1 text-sm text-slatePro-200"
      >
        <option value="">All EU risk</option>
        {EU_RISKS.map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>
      <select
        value={params.get("layer") ?? ""}
        onChange={(e) => setFilter("layer", e.target.value)}
        className="rounded border border-slatePro-600 bg-slatePro-900 px-2 py-1 text-sm text-slatePro-200"
      >
        <option value="">All layers</option>
        {LAYERS.map((l) => (
          <option key={l} value={l}>{l.replace("LAYER_", "L")}</option>
        ))}
      </select>
      <select
        value={params.get("vertical") ?? ""}
        onChange={(e) => setFilter("vertical", e.target.value)}
        className="rounded border border-slatePro-600 bg-slatePro-900 px-2 py-1 text-sm text-slatePro-200"
      >
        <option value="">All verticals</option>
        {VERTICALS.map((v) => (
          <option key={v} value={v}>{v}</option>
        ))}
      </select>
      <select
        value={params.get("operatingModel") ?? ""}
        onChange={(e) => setFilter("operatingModel", e.target.value)}
        className="rounded border border-slatePro-600 bg-slatePro-900 px-2 py-1 text-sm text-slatePro-200"
      >
        <option value="">All operating</option>
        {OPERATING.map((o) => (
          <option key={o} value={o}>{o.replace("_", " ")}</option>
        ))}
      </select>
      <select
        value={params.get("status") ?? ""}
        onChange={(e) => setFilter("status", e.target.value)}
        className="rounded border border-slatePro-600 bg-slatePro-900 px-2 py-1 text-sm text-slatePro-200"
      >
        <option value="">All status</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
    </div>
  );
}
