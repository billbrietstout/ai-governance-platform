/**
 * Map organization client verticals (settings / vertical-regulations) to use-case
 * catalog verticals for filtering the use-case library.
 */

import type { VerticalKey } from "@/lib/vertical-regulations";
import { VERTICAL_REGULATIONS } from "@/lib/vertical-regulations";

import type { UseCase, UseCaseVertical } from "./catalog";

export const ORG_VERTICAL_TO_USE_CASE_VERTICALS: Record<
  Exclude<VerticalKey, "GENERAL">,
  readonly UseCaseVertical[]
> = {
  FINANCIAL_SERVICES: ["FINANCIAL"],
  HEALTHCARE: ["HEALTHCARE"],
  INSURANCE: ["FINANCIAL"],
  PUBLIC_SECTOR: ["CUSTOMER_SERVICE", "HR", "FINANCIAL"],
  ENERGY: ["MANUFACTURING"],
  HR_SERVICES: ["HR"],
  AUTOMOTIVE: ["MANUFACTURING"],
  TELECOM: ["RETAIL", "CUSTOMER_SERVICE"],
  MANUFACTURING: ["MANUFACTURING"],
  RETAIL: ["RETAIL"]
};

const USE_CASE_VERTICAL_LABELS: Record<UseCaseVertical, string> = {
  MANUFACTURING: "Manufacturing",
  FINANCIAL: "Financial services",
  HEALTHCARE: "Healthcare",
  HR: "HR / People",
  RETAIL: "Retail",
  CUSTOMER_SERVICE: "Customer service"
};

export type VerticalFilterSelectValue = "ALL" | string;

export function getOrgVerticalFilterOptions(orgVerticals: VerticalKey[]): {
  value: VerticalFilterSelectValue;
  label: string;
}[] {
  const opts: { value: VerticalFilterSelectValue; label: string }[] = [
    { value: "ALL", label: "All verticals" }
  ];
  const seen = new Set<string>(["ALL"]);
  for (const key of orgVerticals) {
    if (key === "GENERAL") continue;
    if (seen.has(key)) continue;
    seen.add(key);
    opts.push({
      value: key,
      label: VERTICAL_REGULATIONS[key]?.label ?? key
    });
  }
  return opts;
}

/** When the org has not saved verticals yet, mirror legacy catalog-only options. */
export function getCatalogVerticalFilterOptions(useCases: UseCase[]): {
  value: VerticalFilterSelectValue;
  label: string;
}[] {
  const uniq = [...new Set(useCases.map((c) => c.vertical))].sort();
  return [
    { value: "ALL", label: "All verticals" },
    ...uniq.map((v) => ({
      value: v,
      label: USE_CASE_VERTICAL_LABELS[v]
    }))
  ];
}

export function useCaseMatchesVerticalFilter(
  u: UseCase,
  filter: VerticalFilterSelectValue
): boolean {
  if (filter === "ALL" || filter === "GENERAL") return true;

  const mapped =
    ORG_VERTICAL_TO_USE_CASE_VERTICALS[filter as Exclude<VerticalKey, "GENERAL">];
  if (mapped) return mapped.includes(u.vertical);

  return u.vertical === (filter as UseCaseVertical);
}
