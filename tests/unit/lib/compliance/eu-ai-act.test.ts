import { describe, it, expect } from "vitest";
import {
  classifyEURiskLevel,
  checkProhibitedPractices,
  validateHighRiskRequirements
} from "@/lib/compliance/eu-ai-act";

describe("classifyEURiskLevel", () => {
  it("returns existing euRiskLevel when set", () => {
    const r = classifyEURiskLevel({ assetType: "MODEL", euRiskLevel: "HIGH" });
    expect(r.level).toBe("HIGH");
    expect(r.requiredArticles.length).toBeGreaterThan(0);
  });

  it("returns MINIMAL when no indicators", () => {
    const r = classifyEURiskLevel({
      assetType: "MODEL",
      description: "A simple classifier"
    });
    expect(r.level).toBe("MINIMAL");
    expect(r.requiredArticles).toEqual([]);
  });

  it("returns UNACCEPTABLE for prohibited indicators in description", () => {
    const r = classifyEURiskLevel({
      assetType: "MODEL",
      description: "Uses subliminal techniques"
    });
    expect(r.level).toBe("UNACCEPTABLE");
  });

  it("returns HIGH for Annex III-style use case", () => {
    const r = classifyEURiskLevel({
      assetType: "APPLICATION",
      description: "Recruitment screening tool"
    });
    expect(r.level).toBe("HIGH");
  });
});

describe("checkProhibitedPractices", () => {
  it("returns prohibited true when euRiskLevel is UNACCEPTABLE", () => {
    const r = checkProhibitedPractices({ assetType: "MODEL", euRiskLevel: "UNACCEPTABLE" });
    expect(r.prohibited).toBe(true);
    expect(r.reasons.length).toBeGreaterThan(0);
  });

  it("returns prohibited false for minimal risk asset", () => {
    const r = checkProhibitedPractices({
      assetType: "MODEL",
      description: "Image classifier"
    });
    expect(r.prohibited).toBe(false);
  });

  it("detects subliminal in description", () => {
    const r = checkProhibitedPractices({
      assetType: "MODEL",
      description: "Uses subliminal messaging"
    });
    expect(r.prohibited).toBe(true);
    expect(r.reasons.some((x) => x.toLowerCase().includes("art. 5"))).toBe(true);
  });
});

describe("validateHighRiskRequirements", () => {
  it("returns Annex III message when not high-risk", () => {
    const results = validateHighRiskRequirements({ assetType: "MODEL", euRiskLevel: "MINIMAL" });
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.message.includes("Not high-risk"))).toBe(true);
  });

  it("returns multiple articles when high-risk", () => {
    const results = validateHighRiskRequirements({ assetType: "MODEL", euRiskLevel: "HIGH" });
    expect(results.length).toBeGreaterThan(1);
    expect(results.every((r) => r.passed === true)).toBe(true);
  });
});
