import { describe, it, expect, vi } from "vitest";
import {
  calculateComplianceScore,
  getGapAnalysis,
  getCrossFrameworkMapping
} from "@/lib/compliance/engine";

const mockPrisma = {
  aIAsset: { findFirst: vi.fn() },
  complianceFramework: { findMany: vi.fn() },
  control: { findMany: vi.fn(), findUnique: vi.fn() },
  controlAttestation: { findMany: vi.fn() },
  $queryRaw: vi.fn()
};

describe("calculateComplianceScore", () => {
  it("returns zero score when asset not found", async () => {
    mockPrisma.aIAsset.findFirst.mockResolvedValue(null);
    const result = await calculateComplianceScore(mockPrisma as never, "asset-1");
    expect(result.score).toBe(0);
    expect(result.total).toBe(0);
    expect(result.percentage).toBe(0);
    expect(result.gaps).toEqual([]);
    expect(result.byLayer).toEqual({});
  });

  it("returns score and byLayer when frameworks and attestations exist", async () => {
    mockPrisma.aIAsset.findFirst.mockResolvedValue({ orgId: "org-1" });
    mockPrisma.$queryRaw.mockResolvedValue([{ id: "fw-1", code: "NIST_AI_RMF" }]);
    mockPrisma.control.findMany.mockResolvedValue([
      {
        id: "c1",
        controlId: "GOV-1",
        frameworkId: "fw-1",
        title: "Governance",
        cosaiLayer: "LAYER_1_BUSINESS",
        nist80053Family: "PL"
      },
      {
        id: "c2",
        controlId: "MAP-1",
        frameworkId: "fw-1",
        title: "Mapping",
        cosaiLayer: "LAYER_2_INFORMATION",
        nist80053Family: "RA"
      }
    ]);
    mockPrisma.controlAttestation.findMany.mockResolvedValue([
      { controlId: "c1", status: "COMPLIANT" }
    ]);

    const result = await calculateComplianceScore(mockPrisma as never, "asset-1");
    expect(result.total).toBe(2);
    expect(result.score).toBe(1);
    expect(result.percentage).toBe(50);
    expect(result.gaps).toHaveLength(1);
    expect(result.gaps[0].controlId).toBe("MAP-1");
    expect(result.gaps[0].nist80053Family).toBe("RA");
    expect(Object.keys(result.byLayer).length).toBeGreaterThan(0);
  });
});

describe("getGapAnalysis", () => {
  it("returns byFramework, byLayer, criticalGaps, recommendations", async () => {
    mockPrisma.aIAsset.findFirst.mockResolvedValue({ orgId: "org-1" });
    mockPrisma.$queryRaw
      .mockResolvedValueOnce([{ id: "fw-1", code: "NIST_AI_RMF" }])
      .mockResolvedValueOnce([{ id: "fw-1", code: "NIST_AI_RMF", name: "NIST AI RMF" }]);
    mockPrisma.control.findMany
      .mockResolvedValueOnce([
        {
          id: "c1",
          controlId: "GOV-1",
          frameworkId: "fw-1",
          title: "G",
          cosaiLayer: "LAYER_1_BUSINESS",
          nist80053Family: "PL"
        }
      ])
      .mockResolvedValueOnce([{ id: "c1", frameworkId: "fw-1", cosaiLayer: "LAYER_1_BUSINESS" }]);
    mockPrisma.controlAttestation.findMany.mockResolvedValue([]);

    const result = await getGapAnalysis(mockPrisma as never, "asset-1");
    expect(result).toHaveProperty("byFramework");
    expect(result).toHaveProperty("byLayer");
    expect(result).toHaveProperty("gapsByNist80053Family");
    expect(result).toHaveProperty("criticalGaps");
    expect(result).toHaveProperty("recommendations");
    expect(Array.isArray(result.recommendations)).toBe(true);
  });
});

describe("getCrossFrameworkMapping", () => {
  it("returns empty array when control has no crossFrameworkIds", async () => {
    mockPrisma.control.findUnique.mockResolvedValue({
      id: "c1",
      crossFrameworkIds: null,
      frameworkId: "fw-1"
    });
    const result = await getCrossFrameworkMapping(mockPrisma as never, "c1");
    expect(result).toEqual([]);
  });

  it("returns related controls when crossFrameworkIds present", async () => {
    mockPrisma.control.findUnique.mockResolvedValue({
      id: "c1",
      crossFrameworkIds: ["AC-1"],
      frameworkId: "fw-1"
    });
    mockPrisma.control.findMany.mockResolvedValue([
      {
        id: "c2",
        controlId: "AC-1",
        title: "Access Control",
        frameworkId: "fw-2"
      }
    ]);
    mockPrisma.$queryRaw.mockResolvedValue([
      { id: "fw-2", code: "NIST_CSF", name: "NIST CSF" }
    ]);
    const result = await getCrossFrameworkMapping(mockPrisma as never, "c1");
    expect(result).toHaveLength(1);
    expect(result[0].frameworkCode).toBe("NIST_CSF");
    expect(result[0].title).toBe("Access Control");
  });
});
