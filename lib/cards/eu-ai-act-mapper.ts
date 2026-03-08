/**
 * EU AI Act mapper – map card fields to Articles 10–15.
 * Flags missing required documentation for HIGH risk systems.
 */
import type { NormalizedCard } from "./normalizer";
import type { EuRiskLevel } from "@prisma/client";

export type RequirementCoverage = {
  article: string;
  title: string;
  required: boolean;
  covered: boolean;
  field: string;
  value: string;
};

const ARTICLE_MAP: { article: string; title: string; field: keyof NormalizedCard; requiredForHigh: boolean }[] = [
  { article: "Art. 10", title: "Data governance", field: "trainingData", requiredForHigh: true },
  { article: "Art. 11", title: "Data governance", field: "trainingData", requiredForHigh: true },
  { article: "Art. 12", title: "Technical documentation", field: "trainingData", requiredForHigh: true },
  { article: "Art. 13", title: "Transparency", field: "intendedUse", requiredForHigh: true },
  { article: "Art. 14", title: "Human oversight", field: "intendedUse", requiredForHigh: true },
  { article: "Art. 15", title: "Accuracy", field: "evaluations", requiredForHigh: true }
];

export function mapCardToEURequirements(
  card: NormalizedCard,
  riskLevel: EuRiskLevel | null
): RequirementCoverage[] {
  const isHigh = riskLevel === "HIGH";
  const results: RequirementCoverage[] = [];

  for (const { article, title, field, requiredForHigh } of ARTICLE_MAP) {
    const required = isHigh && requiredForHigh;
    const value = card[field];
    const covered =
      typeof value === "string"
        ? value.trim().length > 0
        : Array.isArray(value)
          ? value.length > 0
          : false;

    results.push({
      article,
      title,
      required,
      covered,
      field,
      value: typeof value === "string" ? value : Array.isArray(value) ? JSON.stringify(value) : ""
    });
  }

  const extraFields = [
    { article: "Annex IV", title: "Data governance", field: "trainingData" as const },
    { article: "Annex IV", title: "Bias", field: "biasAnalysis" as const },
    { article: "Annex IV", title: "Limitations", field: "limitations" as const }
  ];
  for (const { article, title, field } of extraFields) {
    const value = card[field];
    const covered =
      typeof value === "string"
        ? value.trim().length > 0
        : Array.isArray(value)
          ? value.length > 0
          : false;
    results.push({
      article,
      title,
      required: isHigh,
      covered,
      field,
      value: typeof value === "string" ? value : Array.isArray(value) ? value.join(", ") : ""
    });
  }

  return results;
}
