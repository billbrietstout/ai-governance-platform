/**
 * OWASP Top 10 for LLM Applications (2025)
 * Maps risks to CoSAI layers for integration with compliance and discovery.
 */

import type { CosaiLayer } from "./layer-security-map";

export type OwaspLlmRisk = {
  id: string;
  code: string;
  name: string;
  description: string;
  cosaiLayer: CosaiLayer;
  mitigations: string[];
  relatedStandards: string[];
};

export const OWASP_LLM_TOP_10: OwaspLlmRisk[] = [
  {
    id: "LLM01",
    code: "LLM01",
    name: "Prompt Injection",
    description: "Manipulating LLM behavior via crafted inputs to bypass guardrails or exfiltrate data",
    cosaiLayer: "LAYER_3_APPLICATION",
    mitigations: [
      "Sanitize and parameterize prompts; implement guardrails",
      "Privilege separation between user input and system instructions",
      "Input validation and output validation before execution"
    ],
    relatedStandards: ["OWASP_LLM", "MITRE_ATLAS", "OWASP_AIVSS"]
  },
  {
    id: "LLM02",
    code: "LLM02",
    name: "Insecure Output Handling",
    description: "Unvalidated LLM output leading to code injection, XSS, or other downstream exploits",
    cosaiLayer: "LAYER_3_APPLICATION",
    mitigations: [
      "Validate and sandbox all outputs before execution",
      "Treat LLM output as untrusted; no direct execution",
      "Output encoding and escaping"
    ],
    relatedStandards: ["OWASP_LLM", "OWASP_AIVSS"]
  },
  {
    id: "LLM03",
    code: "LLM03",
    name: "Training Data Poisoning",
    description: "Malicious or biased data in training sets affecting model behavior",
    cosaiLayer: "LAYER_2_INFORMATION",
    mitigations: [
      "Data provenance and lineage tracking",
      "Vet datasets; use trusted sources",
      "Bias and robustness testing"
    ],
    relatedStandards: ["OWASP_LLM", "MITRE_ATLAS"]
  },
  {
    id: "LLM04",
    code: "LLM04",
    name: "Model Denial of Service",
    description: "Resource exhaustion via costly prompts or excessive requests",
    cosaiLayer: "LAYER_4_PLATFORM",
    mitigations: [
      "Rate limiting and quota enforcement",
      "Input length and complexity limits",
      "Monitoring for anomalous resource usage"
    ],
    relatedStandards: ["OWASP_LLM"]
  },
  {
    id: "LLM05",
    code: "LLM05",
    name: "Supply Chain Vulnerabilities",
    description: "Compromised models, plugins, or dependencies from untrusted sources",
    cosaiLayer: "LAYER_5_SUPPLY_CHAIN",
    mitigations: [
      "SBOM and dependency scanning",
      "Vet models and datasets; use trusted registries",
      "Cryptographic signing and integrity checks"
    ],
    relatedStandards: ["OWASP_LLM", "CSA_AICM"]
  },
  {
    id: "LLM06",
    code: "LLM06",
    name: "Sensitive Information Disclosure",
    description: "LLM revealing confidential data in training data or context",
    cosaiLayer: "LAYER_2_INFORMATION",
    mitigations: [
      "Least privilege; token/memory constraints",
      "Data classification; limit context to necessity",
      "PII detection and redaction"
    ],
    relatedStandards: ["OWASP_LLM", "OWASP_AIVSS"]
  },
  {
    id: "LLM07",
    code: "LLM07",
    name: "Insecure Plugin Design",
    description: "Plugins with excessive permissions or weak authorization",
    cosaiLayer: "LAYER_3_APPLICATION",
    mitigations: [
      "Least-privilege design for plugins and tools",
      "Explicit user approval for sensitive actions",
      "Secure orchestration layer"
    ],
    relatedStandards: ["OWASP_LLM", "OWASP_AIVSS"]
  },
  {
    id: "LLM08",
    code: "LLM08",
    name: "Excessive Agency",
    description: "Agents taking unintended high-impact actions without adequate oversight",
    cosaiLayer: "LAYER_3_APPLICATION",
    mitigations: [
      "Human-in-the-loop for high-risk actions",
      "Bounded memory/tokens; no root/system access",
      "Agent identity management; RBAC with scopes"
    ],
    relatedStandards: ["OWASP_LLM", "NIST_AI_RMF", "OWASP_AIVSS"]
  },
  {
    id: "LLM09",
    code: "LLM09",
    name: "Overreliance",
    description: "Blind trust in LLM output without validation or fallbacks",
    cosaiLayer: "LAYER_3_APPLICATION",
    mitigations: [
      "Validation and verification of critical outputs",
      "Fallback procedures when confidence is low",
      "Human review for high-stakes decisions"
    ],
    relatedStandards: ["OWASP_LLM"]
  },
  {
    id: "LLM10",
    code: "LLM10",
    name: "Model Theft",
    description: "Unauthorized extraction of model weights or parameters",
    cosaiLayer: "LAYER_3_APPLICATION",
    mitigations: [
      "Rate limiting on API endpoints",
      "Watermarking and model signing",
      "Access controls and monitoring"
    ],
    relatedStandards: ["OWASP_LLM", "MITRE_ATLAS"]
  }
];

/** Get OWASP risks by CoSAI layer */
export function getOwaspRisksByLayer(layer: CosaiLayer): OwaspLlmRisk[] {
  return OWASP_LLM_TOP_10.filter((r) => r.cosaiLayer === layer);
}
