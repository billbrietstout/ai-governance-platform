"use client";

import { AIVSS_FACTORS } from "@/lib/security-frameworks/aivss";

const LAYER_LABEL: Record<string, string> = {
  LAYER_1_BUSINESS: "Layer 1 · Business",
  LAYER_2_INFORMATION: "Layer 2 · Information",
  LAYER_3_APPLICATION: "Layer 3 · Application",
  LAYER_4_PLATFORM: "Layer 4 · Platform",
  LAYER_5_SUPPLY_CHAIN: "Layer 5 · Supply Chain"
};

export function AIVSSClient() {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-600">
        Map agentic amplification factors to controls and attestations per AI asset. AIVSS complements the{" "}
        <span className="font-medium text-slate-800">OWASP Top 10 for LLM Applications</span> by scoring how
        agent capabilities (autonomy, tools, memory, delegation) increase exposure from a base vulnerability.
      </p>
      <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
        {AIVSS_FACTORS.map((f) => (
          <li key={f.id} className="px-4 py-4 first:rounded-t-lg last:rounded-b-lg">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-semibold text-slate-900">
                {f.id}. {f.name}
              </h2>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                {LAYER_LABEL[f.cosaiLayer] ?? f.cosaiLayer}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-600">{f.description}</p>
            {f.relatedOwaspLlm && f.relatedOwaspLlm.length > 0 ? (
              <p className="mt-2 text-xs text-slate-500">
                Related OWASP LLM: {f.relatedOwaspLlm.join(", ")}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
