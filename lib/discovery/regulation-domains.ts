/**
 * Maps regulation codes to control domains for chord diagram and shared-controls analysis.
 * Based on: EU AI Act, ISO 42001, NIST AI RMF, SR 11-7, NYC LL144, CoSAI, etc.
 */

export const CONTROL_DOMAINS = [
  "Data policy",
  "Risk Management",
  "Human Oversight",
  "Documentation",
  "Monitoring",
  "Supply Chain",
  "Incident Response",
  "Bias & Fairness"
] as const;

export type ControlDomain = (typeof CONTROL_DOMAINS)[number];

/** Regulation code → control domains (partial match by prefix) */
const REGULATION_TO_DOMAINS: Record<string, ControlDomain[]> = {
  // EU AI Act variants
  EU_AI_ACT: [
    "Data policy",
    "Risk Management",
    "Human Oversight",
    "Documentation",
    "Monitoring",
    "Supply Chain",
    "Incident Response",
    "Bias & Fairness"
  ],
  EU_AI_ACT_ANNEX_III: [
    "Data policy",
    "Risk Management",
    "Human Oversight",
    "Documentation",
    "Monitoring",
    "Supply Chain",
    "Incident Response",
    "Bias & Fairness"
  ],
  EU_AI_ACT_LIMITED: ["Documentation", "Human Oversight", "Bias & Fairness"],
  EU_AI_ACT_MINIMAL: ["Documentation"],
  EU_AI_ACT_CREDIT: [
    "Data policy",
    "Risk Management",
    "Human Oversight",
    "Documentation",
    "Monitoring",
    "Supply Chain",
    "Incident Response",
    "Bias & Fairness"
  ],
  EU_AI_ACT_MEDICAL: [
    "Data policy",
    "Risk Management",
    "Human Oversight",
    "Documentation",
    "Monitoring",
    "Supply Chain",
    "Incident Response",
    "Bias & Fairness"
  ],
  EU_AI_ACT_INSURANCE: [
    "Data policy",
    "Risk Management",
    "Human Oversight",
    "Documentation",
    "Monitoring",
    "Supply Chain",
    "Incident Response",
    "Bias & Fairness"
  ],
  EU_AI_ACT_PUBLIC: [
    "Data policy",
    "Risk Management",
    "Human Oversight",
    "Documentation",
    "Monitoring",
    "Supply Chain",
    "Incident Response",
    "Bias & Fairness"
  ],
  EU_AI_ACT_CRITICAL: [
    "Data policy",
    "Risk Management",
    "Human Oversight",
    "Documentation",
    "Monitoring",
    "Supply Chain",
    "Incident Response",
    "Bias & Fairness"
  ],
  EU_AI_ACT_EMPLOYMENT: [
    "Data policy",
    "Risk Management",
    "Human Oversight",
    "Documentation",
    "Monitoring",
    "Supply Chain",
    "Incident Response",
    "Bias & Fairness"
  ],

  // ISO 42001
  ISO_42001: [
    "Data policy",
    "Risk Management",
    "Documentation",
    "Monitoring",
    "Supply Chain",
    "Incident Response"
  ],

  // OWASP
  OWASP_LLM: [
    "Risk Management",
    "Human Oversight",
    "Documentation",
    "Monitoring",
    "Supply Chain",
    "Incident Response"
  ],
  OWASP_AIVSS: [
    "Risk Management",
    "Human Oversight",
    "Documentation",
    "Monitoring",
    "Incident Response"
  ],

  // NIST
  NIST_AI_RMF: [
    "Risk Management",
    "Monitoring",
    "Supply Chain",
    "Incident Response",
    "Bias & Fairness"
  ],
  NIST_CSF: ["Risk Management", "Monitoring", "Incident Response"],

  // CoSAI
  COSAI_SRF: [
    "Risk Management",
    "Human Oversight",
    "Documentation",
    "Monitoring",
    "Supply Chain",
    "Incident Response",
    "Bias & Fairness"
  ],
  AGENTIC_GOVERNANCE: ["Human Oversight", "Documentation", "Monitoring", "Incident Response"],

  // US financial
  SR_11_7: ["Data policy", "Documentation"],
  SEC_AI: ["Documentation", "Risk Management"],
  DORA: ["Risk Management", "Incident Response", "Documentation", "Monitoring"],

  // US healthcare
  FDA_SAMD: ["Documentation", "Risk Management", "Human Oversight", "Monitoring"],
  HIPAA_AI: ["Data policy", "Documentation", "Incident Response"],
  EMA_AI: ["Documentation", "Risk Management"],

  // US state/local
  NYC_LL144: ["Bias & Fairness", "Documentation", "Human Oversight"],
  IL_AEIA: ["Bias & Fairness", "Documentation", "Human Oversight"],
  CO_SB21_169: ["Bias & Fairness", "Documentation", "Risk Management"],
  NAIC_AI: ["Documentation", "Risk Management", "Bias & Fairness"],

  // US federal
  EEOC_AI: ["Bias & Fairness", "Documentation"],
  EO_14110: ["Risk Management", "Documentation", "Supply Chain", "Incident Response"],
  OMB_AI: ["Risk Management", "Documentation", "Human Oversight"],
  NERC_CIP: ["Risk Management", "Incident Response", "Monitoring"],

  // GDPR
  GDPR_AI: ["Data policy", "Documentation", "Incident Response"],

  // Other
  VULNERABLE_POP: ["Human Oversight", "Documentation", "Monitoring"]
};

/** Get control domains for a regulation by code (supports prefix match) */
export function getDomainsForRegulation(code: string): ControlDomain[] {
  if (REGULATION_TO_DOMAINS[code]) return REGULATION_TO_DOMAINS[code];
  // Prefix match: EU_AI_ACT_* → EU_AI_ACT domains
  for (const [key, domains] of Object.entries(REGULATION_TO_DOMAINS)) {
    if (code.startsWith(key) || key.startsWith(code)) return domains;
  }
  // Fallback: EU → EU_AI_ACT, NIST → NIST_AI_RMF, etc.
  if (code.includes("EU") || code.includes("GDPR")) return REGULATION_TO_DOMAINS.EU_AI_ACT;
  if (code.includes("NIST")) return REGULATION_TO_DOMAINS.NIST_AI_RMF;
  if (code.includes("ISO")) return REGULATION_TO_DOMAINS.ISO_42001;
  if (code.includes("AIVSS") || code.includes("OWASP_AIVSS")) return REGULATION_TO_DOMAINS.OWASP_AIVSS;
  if (code.includes("OWASP")) return REGULATION_TO_DOMAINS.OWASP_LLM;
  if (code.includes("NYC") || code.includes("LL144")) return REGULATION_TO_DOMAINS.NYC_LL144;
  if (code.includes("COSAI") || code.includes("CoSAI")) return REGULATION_TO_DOMAINS.COSAI_SRF;
  return ["Documentation", "Risk Management"];
}

export type RegulationForChord = {
  code: string;
  name: string;
  jurisdiction: string;
  mandatory?: boolean;
  applicability?: string;
};

/** Build chord matrix: matrix[i][j] = shared control domains between reg i and j; diagonal = total for reg i */
export function buildChordMatrix(regulations: RegulationForChord[]): {
  matrix: number[][];
  sharedByPair: Map<string, number>;
} {
  const n = regulations.length;
  const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  const sharedByPair = new Map<string, number>();

  const domainsByReg = regulations.map((r) => getDomainsForRegulation(r.code));

  for (let i = 0; i < n; i++) {
    const di = domainsByReg[i];
    matrix[i][i] = di.length;
    for (let j = i + 1; j < n; j++) {
      const dj = domainsByReg[j];
      const shared = di.filter((d) => dj.includes(d)).length;
      matrix[i][j] = shared;
      matrix[j][i] = shared;
      sharedByPair.set([regulations[i].code, regulations[j].code].sort().join("|"), shared);
    }
  }

  return { matrix, sharedByPair };
}

/** Shared control domains across regulations */
export function getSharedDomainsSummary(
  regulations: RegulationForChord[]
): { domain: ControlDomain; regulations: RegulationForChord[] }[] {
  const domainToRegs = new Map<ControlDomain, RegulationForChord[]>();

  for (const reg of regulations) {
    const domains = getDomainsForRegulation(reg.code);
    for (const d of domains) {
      const list = domainToRegs.get(d) ?? [];
      if (!list.some((r) => r.code === reg.code)) list.push(reg);
      domainToRegs.set(d, list);
    }
  }

  return CONTROL_DOMAINS.filter((d) => (domainToRegs.get(d)?.length ?? 0) >= 2).map((domain) => ({
    domain,
    regulations: domainToRegs.get(domain) ?? []
  }));
}

/** Efficiency: % of required control domains that satisfy 2+ regulations (implement once, satisfy many) */
export function getEfficiencyScore(regulations: RegulationForChord[]): number {
  if (regulations.length < 2) return 0;
  const shared = getSharedDomainsSummary(regulations);
  const allDomains = new Set<ControlDomain>();
  for (const r of regulations) {
    for (const d of getDomainsForRegulation(r.code)) allDomains.add(d);
  }
  const totalUnique = allDomains.size;
  const sharedCount = shared.length; // domains that appear in 2+ regulations
  if (totalUnique === 0) return 0;
  return Math.round((sharedCount / totalUnique) * 100);
}
