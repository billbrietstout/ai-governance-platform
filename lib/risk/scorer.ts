/**
 * Risk scorer – likelihood × impact, rating, residual risk.
 */

export type RiskRating = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

/**
 * Calculate risk score from likelihood (1–5) and impact (1–5).
 * Default 5×5 matrix; can use geometric or linear.
 */
export function calculateRiskScore(likelihood: number, impact: number): number {
  const L = Math.max(1, Math.min(5, Math.round(likelihood)));
  const I = Math.max(1, Math.min(5, Math.round(impact)));
  return L * I;
}

/**
 * Map numeric score to rating.
 * 1–6 LOW, 7–12 MEDIUM, 13–20 HIGH, 21–25 CRITICAL.
 */
export function getRiskRating(score: number): RiskRating {
  if (score <= 0) return "LOW";
  if (score <= 6) return "LOW";
  if (score <= 12) return "MEDIUM";
  if (score <= 20) return "HIGH";
  return "CRITICAL";
}

/**
 * Control effectiveness 0–1 (e.g. from attestation status or maturity).
 */
export type ControlEffectiveness = {
  controlId: string;
  effectiveness: number;
};

/**
 * Reduce risk score by controls. Residual = riskScore * (1 - weighted mitigation).
 * Simple model: residual = riskScore * product of (1 - effectiveness) for each control, capped by max reduction.
 */
export function calculateResidualRisk(
  riskScore: number,
  controls: ControlEffectiveness[],
  maxReduction = 0.9
): number {
  if (controls.length === 0) return riskScore;
  const combinedMitigation = 1 - controls.reduce((acc, c) => acc * (1 - Math.max(0, Math.min(1, c.effectiveness))), 1);
  const reduction = Math.min(maxReduction, combinedMitigation);
  return Math.round((riskScore * (1 - reduction)) * 10) / 10;
}
