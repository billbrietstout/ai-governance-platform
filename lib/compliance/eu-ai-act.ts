/**
 * EU AI Act – risk classification, prohibited practices, high-risk validation.
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
  if (
    desc.includes("subliminal") ||
    desc.includes("manipulation") ||
    desc.includes("exploit vulnerability")
  ) {
    reasons.push("Potential prohibited practice (Art. 5)");
    return {
      level: "UNACCEPTABLE",
      rationale: "Indication of prohibited AI practices per Art. 5.",
      requiredArticles: ["Art. 5"]
    };
  }

  if (
    asset.assetType === "APPLICATION" &&
    (desc.includes("recruitment") || desc.includes("credit") || desc.includes("border"))
  ) {
    reasons.push("Annex III high-risk use case");
    return {
      level: "HIGH",
      rationale: "Likely Annex III high-risk AI system.",
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

  if (desc.includes("subliminal") && !desc.includes("not subliminal")) {
    reasons.push("Subliminal techniques beyond awareness (Art. 5(1)(a)).");
  }
  if (desc.includes("exploit vulnerability") || desc.includes("exploiting vulnerability")) {
    reasons.push("Exploitation of vulnerabilities (Art. 5(1)(b)).");
  }
  if (desc.includes("social scoring") || desc.includes("social scoring")) {
    reasons.push("Social scoring (Art. 5(1)(c)).");
  }
  if (desc.includes("real-time") && desc.includes("biometric") && desc.includes("public")) {
    reasons.push("Real-time remote biometric identification in publicly accessible spaces (Art. 5(1)(d)).");
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
