/**
 * Vertical profiles – GENERAL (first pilot).
 */
export const VERTICAL_GENERAL = {
  code: "GENERAL",
  name: "General",
  description: "General-purpose AI governance profile for cross-industry use.",
  applicableFrameworks: ["NIST_AI_RMF", "EU_AI_ACT", "COSAI_SRF", "NIST_CSF"],
  defaultControls: []
} as const;

export type VerticalProfile = typeof VERTICAL_GENERAL;
