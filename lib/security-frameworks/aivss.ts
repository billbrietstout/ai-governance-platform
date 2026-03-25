/**
 * OWASP Agentic AI Vulnerability Scoring System (AIVSS)
 *
 * AIVSS produces a 0–10 composite score from a base vulnerability severity plus
 * agentic amplification factors. This module mirrors seeded controls in
 * `prisma/seed/data/owasp-aivss.json` for UI and cross-links.
 *
 * @see https://owasp.org (OWASP Agentic AI / AIVSS project materials)
 */

import type { CosaiLayer } from "./layer-security-map";

export type AivssFactor = {
  id: string;
  name: string;
  description: string;
  cosaiLayer: CosaiLayer;
  /** Related OWASP LLM Top 10 items where applicable */
  relatedOwaspLlm?: string[];
};

/** Agentic amplification and governance dimensions (AIVSS-A1 … AIVSS-A9) */
export const AIVSS_FACTORS: AivssFactor[] = [
  {
    id: "AIVSS-A1",
    name: "Agent autonomy & execution scope",
    description: "Unsupervised or asynchronous action without human approval.",
    cosaiLayer: "LAYER_3_APPLICATION",
    relatedOwaspLlm: ["LLM08"]
  },
  {
    id: "AIVSS-A2",
    name: "Tool, plugin, and API scope",
    description: "Breadth and privilege of invocable tools and integrations.",
    cosaiLayer: "LAYER_3_APPLICATION",
    relatedOwaspLlm: ["LLM07"]
  },
  {
    id: "AIVSS-A3",
    name: "Memory, state & long-term persistence",
    description: "Retained state across sessions (memory stores, scratchpads).",
    cosaiLayer: "LAYER_2_INFORMATION",
    relatedOwaspLlm: ["LLM06"]
  },
  {
    id: "AIVSS-A4",
    name: "Delegation & multi-agent orchestration",
    description: "Sub-agents and delegation chains increasing indirect impact.",
    cosaiLayer: "LAYER_3_APPLICATION",
    relatedOwaspLlm: ["LLM08"]
  },
  {
    id: "AIVSS-A5",
    name: "External connectivity & network exposure",
    description: "Internet and third-party API reachability from the agent.",
    cosaiLayer: "LAYER_4_PLATFORM",
    relatedOwaspLlm: ["LLM01"]
  },
  {
    id: "AIVSS-A6",
    name: "Identity, authorization & trust boundaries",
    description: "Authentication to downstream systems and privilege boundaries.",
    cosaiLayer: "LAYER_3_APPLICATION",
    relatedOwaspLlm: ["LLM07"]
  },
  {
    id: "AIVSS-A7",
    name: "Sensitive data in agent context",
    description: "PII, secrets, or regulated data in prompts, memory, or tools.",
    cosaiLayer: "LAYER_2_INFORMATION",
    relatedOwaspLlm: ["LLM06"]
  },
  {
    id: "AIVSS-A8",
    name: "Base vulnerability severity",
    description: "Underlying CWE/CVE-aligned weakness before agentic amplification.",
    cosaiLayer: "LAYER_3_APPLICATION"
  },
  {
    id: "AIVSS-A9",
    name: "Scoring methodology & review cadence",
    description: "Governance for 0–10 scores, calibration, and reassessment.",
    cosaiLayer: "LAYER_1_BUSINESS"
  }
];

export function getAivssFactorsByLayer(layer: CosaiLayer): AivssFactor[] {
  return AIVSS_FACTORS.filter((f) => f.cosaiLayer === layer);
}
