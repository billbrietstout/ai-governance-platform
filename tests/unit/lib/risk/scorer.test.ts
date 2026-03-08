import { describe, it, expect } from "vitest";
import {
  calculateRiskScore,
  getRiskRating,
  calculateResidualRisk,
  type ControlEffectiveness
} from "@/lib/risk/scorer";

describe("calculateRiskScore", () => {
  it("returns likelihood × impact for 1–5 range", () => {
    expect(calculateRiskScore(1, 1)).toBe(1);
    expect(calculateRiskScore(5, 5)).toBe(25);
    expect(calculateRiskScore(3, 4)).toBe(12);
  });

  it("clamps inputs to 1–5", () => {
    expect(calculateRiskScore(0, 1)).toBe(1);
    expect(calculateRiskScore(10, 1)).toBe(5);
    expect(calculateRiskScore(2, 0)).toBe(2);
  });

  it("rounds fractional inputs", () => {
    expect(calculateRiskScore(2.3, 3.7)).toBe(8); // 2 * 4
  });
});

describe("getRiskRating", () => {
  it("returns LOW for score ≤ 6", () => {
    expect(getRiskRating(0)).toBe("LOW");
    expect(getRiskRating(1)).toBe("LOW");
    expect(getRiskRating(6)).toBe("LOW");
  });

  it("returns MEDIUM for 7–12", () => {
    expect(getRiskRating(7)).toBe("MEDIUM");
    expect(getRiskRating(12)).toBe("MEDIUM");
  });

  it("returns HIGH for 13–20", () => {
    expect(getRiskRating(13)).toBe("HIGH");
    expect(getRiskRating(20)).toBe("HIGH");
  });

  it("returns CRITICAL for 21+", () => {
    expect(getRiskRating(21)).toBe("CRITICAL");
    expect(getRiskRating(25)).toBe("CRITICAL");
  });
});

describe("calculateResidualRisk", () => {
  it("returns riskScore when no controls", () => {
    expect(calculateResidualRisk(20, [])).toBe(20);
  });

  it("reduces score with effective controls", () => {
    const controls: ControlEffectiveness[] = [
      { controlId: "c1", effectiveness: 0.5 },
      { controlId: "c2", effectiveness: 0.5 }
    ];
    const residual = calculateResidualRisk(20, controls);
    expect(residual).toBeLessThan(20);
    expect(residual).toBeGreaterThan(0);
  });

  it("respects maxReduction cap", () => {
    const controls: ControlEffectiveness[] = [
      { controlId: "c1", effectiveness: 1 },
      { controlId: "c2", effectiveness: 1 }
    ];
    const residual = calculateResidualRisk(20, controls, 0.9);
    expect(residual).toBeGreaterThanOrEqual(2);
  });

  it("clamps effectiveness to 0–1", () => {
    const controls: ControlEffectiveness[] = [{ controlId: "c1", effectiveness: 1.5 }];
    const residual = calculateResidualRisk(10, controls);
    expect(residual).toBeLessThanOrEqual(10);
  });
});
