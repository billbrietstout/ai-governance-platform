/**
 * Vertical options for onboarding – industry, description, key regulations.
 */
import { VERTICAL_REGULATIONS } from "@/lib/vertical-regulations";
import { orgVerticalToKey } from "@/lib/vertical-regulations";

export const VERTICAL_OPTIONS = [
  { value: "GENERAL", label: "General (Manufacturing/Retail)" },
  { value: "FINANCIAL", label: "Financial Services" },
  { value: "HEALTHCARE", label: "Healthcare" },
  { value: "INSURANCE", label: "Insurance" },
  { value: "PUBLIC_SECTOR", label: "Public Sector" },
  { value: "ENERGY", label: "Energy" },
  { value: "RETAIL", label: "Retail" },
  { value: "MANUFACTURING", label: "Manufacturing" },
  { value: "AUTOMOTIVE", label: "Automotive" }
];

export function getVerticalLabel(value: string): string {
  const opt = VERTICAL_OPTIONS.find((o) => o.value === value);
  return opt?.label ?? value;
}

export function getVerticalRegulations(value: string): { code: string; name: string }[] {
  const key = orgVerticalToKey(value);
  const profile = VERTICAL_REGULATIONS[key];
  return profile?.regulations.map((r) => ({ code: r.code, name: r.name })) ?? [];
}
