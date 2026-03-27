"use client";

import { AIVSS_FACTORS } from "@/lib/security-frameworks/aivss";
import { SECTION_HEADING_CLASS } from "@/lib/ui/section-heading";

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
      <div>
        <h2 className={SECTION_HEADING_CLASS}>Amplification factors (AIVSS-A1 … AIVSS-A9)</h2>
        <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white shadow-sm">
          {AIVSS_FACTORS.map((f) => (
            <li
              key={f.id}
              className="px-4 py-4 transition first:rounded-t-lg last:rounded-b-lg hover:bg-slate-50"
            >
              <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-2">
                <h3 className="min-w-0 font-semibold text-slate-900">
                  {f.id}. {f.name}
                </h3>
                <span className="shrink-0 rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
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
    </div>
  );
}
