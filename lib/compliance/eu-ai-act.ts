/**
 * EU AI Act – risk classification, prohibited practices, high-risk validation.
 * Aligned with Future of Life Institute Compliance Checker Flowchart v1.0 (July 2025).
 */
import type { EuRiskLevel } from "@prisma/client";

export type EURiskResult = {
  level: EuRiskLevel;
  rationale: string;
  requiredArticles: string[];
};

export type ProhibitedResult = {
  prohibited: boolean;
  reasons: string[];
};

export type ValidationResult = {
  article: string;
  passed: boolean;
  message: string;
};

/** Art. 5 prohibited practice keywords (flowchart #R3) */
const PROHIBITED_KEYWORDS: { pattern: RegExp; article: string }[] = [
  { pattern: /\bsubliminal\b/, article: "Art. 5(1)(a)" },
  { pattern: /\bmanipulation\b|\bdeception\b|\bdeceptive\b/, article: "Art. 5(1)(a)" },
  { pattern: /\bexploit(?:ing)?\s*vulnerab/i, article: "Art. 5(1)(b)" },
  { pattern: /\bsocial\s*scoring\b/, article: "Art. 5(1)(c)" },
  {
    pattern: /\breal[- ]?time.*(?:remote\s+)?biometric|biometric.*real[- ]?time.*public/i,
    article: "Art. 5(1)(d)"
  },
  { pattern: /\bbiometric\s*categoris/i, article: "Art. 5(1)(a)" },
  { pattern: /\bpredictive\s*policing\b/, article: "Art. 5(1)(a)" },
  {
    pattern: /\b(?:expand(?:ing)?|grow)\s*(?:facial|face)\s*(?:recognition\s*)?(?:database|db)s?/i,
    article: "Art. 5(1)(a)"
  },
  {
    pattern: /\bemotion\s*recognition\b.*(?:workplace|education|school)/i,
    article: "Art. 5(1)(a)"
  }
];

/** Annex III high-risk use-case keywords by domain */
const ANNEX_III_KEYWORDS: string[] = [
  "biometric",
  "biometrics",
  "recruitment",
  "screening",
  "hiring",
  "employment",
  "workforce",
  "personnel",
  "credit",
  "scoring",
  "lending",
  "insurance",
  "underwriting",
  "education",
  "vocational",
  "training",
  "school",
  "student",
  "critical infrastructure",
  "safety",
  "transport",
  "energy",
  "law enforcement",
  "policing",
  "border",
  "migration",
  "asylum",
  "justice",
  "judicial",
  "democratic",
  "essential service",
  "public service",
  "health",
  "medical",
  "clinical",
  "diagnosis"
];

type AssetInput = {
  assetType: string;
  euRiskLevel?: EuRiskLevel | null;
  description?: string | null;
  autonomyLevel?: string | null;
};

export function classifyEURiskLevel(asset: AssetInput): EURiskResult {
  const reasons: string[] = [];
  const requiredArticles: string[] = [];

  if (asset.euRiskLevel) {
    const rationale =
      asset.euRiskLevel === "UNACCEPTABLE"
        ? "Unacceptable risk: prohibited under Art. 5."
        : asset.euRiskLevel === "HIGH"
          ? "High-risk: Annex III use case or critical infrastructure."
          : asset.euRiskLevel === "LIMITED"
            ? "Limited risk: transparency obligations (Art. 50–52)."
            : "Minimal risk: no specific obligations.";
    requiredArticles.push(
      ...(asset.euRiskLevel === "UNACCEPTABLE"
        ? ["Art. 5"]
        : asset.euRiskLevel === "HIGH"
          ? ["Art. 8–15", "Annex III", "Annex IX"]
          : asset.euRiskLevel === "LIMITED"
            ? ["Art. 50", "Art. 52"]
            : [])
    );
    return { level: asset.euRiskLevel, rationale, requiredArticles };
  }

  const desc = (asset.description ?? "").toLowerCase();

  // Prohibited practices (#R3) – flowchart Art. 5
  for (const { pattern, article } of PROHIBITED_KEYWORDS) {
    if (pattern.test(desc) && !desc.includes("not ") && !desc.includes("excluding")) {
      reasons.push(`Potential prohibited practice (${article})`);
      return {
        level: "UNACCEPTABLE",
        rationale: `Indication of prohibited AI practices per ${article}.`,
        requiredArticles: ["Art. 5"]
      };
    }
  }

  // Annex III high-risk – expanded per flowchart #HR4
  const annexIIIMatch = ANNEX_III_KEYWORDS.some((kw) => desc.includes(kw));
  if (annexIIIMatch && ["APPLICATION", "AGENT", "MODEL"].includes(asset.assetType)) {
    reasons.push("Annex III high-risk use case");
    return {
      level: "HIGH",
      rationale:
        "Likely Annex III high-risk AI system (biometrics, employment, education, critical infrastructure, law enforcement, migration, justice, essential services).",
      requiredArticles: ["Art. 8–15", "Annex III", "Annex IX"]
    };
  }

  if (asset.autonomyLevel === "AUTONOMOUS" || asset.autonomyLevel === "SEMI_AUTONOMOUS") {
    reasons.push("Autonomy may trigger transparency or high-risk rules");
  }

  return {
    level: "MINIMAL",
    rationale: "No clear high-risk or prohibited indicators; default minimal.",
    requiredArticles: []
  };
}

export function checkProhibitedPractices(asset: AssetInput): ProhibitedResult {
  const reasons: string[] = [];
  const desc = (asset.description ?? "").toLowerCase();

  if (asset.euRiskLevel === "UNACCEPTABLE") {
    reasons.push("Classified as unacceptable risk (Art. 5).");
    return { prohibited: true, reasons };
  }

  // Flowchart #R3 – full Art. 5 prohibited list
  for (const { pattern, article } of PROHIBITED_KEYWORDS) {
    if (pattern.test(desc) && !desc.includes("not ") && !desc.includes("excluding")) {
      reasons.push(`Prohibited practice (${article}).`);
    }
  }

  return { prohibited: reasons.length > 0, reasons };
}

export function validateHighRiskRequirements(asset: AssetInput): ValidationResult[] {
  const results: ValidationResult[] = [];
  if (asset.euRiskLevel !== "HIGH") {
    results.push({
      article: "Annex III",
      passed: true,
      message: "Not high-risk; no Annex III validation required."
    });
    return results;
  }

  results.push({
    article: "Art. 9",
    passed: true,
    message: "Risk management system required (implement and document)."
  });
  results.push({
    article: "Art. 10",
    passed: true,
    message: "Data governance and training data quality required."
  });
  results.push({
    article: "Art. 13",
    passed: true,
    message: "Transparency and information to users required."
  });
  results.push({
    article: "Art. 14",
    passed: true,
    message: "Human oversight required."
  });
  results.push({
    article: "Annex IX",
    passed: true,
    message: "Conformity assessment required before placing on market."
  });

  return results;
}
