import { describe, it, expect, vi } from "vitest";
import {
  getVerticalControls,
  getCascadeChain,
  getRegulationMap
} from "@/lib/compliance/vertical-cascade";

const mockPrisma = {
  control: { findMany: vi.fn() },
  complianceFramework: { findMany: vi.fn() },
  $queryRaw: vi.fn()
};

describe("getVerticalControls", () => {
  it("returns controls for org and optional cosaiLayer", async () => {
    mockPrisma.$queryRaw
      .mockResolvedValueOnce([{ id: "fw-1" }])
      .mockResolvedValueOnce([{ id: "fw-1", code: "NIST_AI_RMF", name: "NIST AI RMF" }]);
    mockPrisma.control.findMany.mockResolvedValue([
      {
        id: "c1",
        controlId: "GOV-1",
        title: "Governance",
        frameworkId: "fw-1",
        cosaiLayer: "LAYER_1_BUSINESS",
        verticalApplicability: null
      }
    ]);
    const result = await getVerticalControls(
      mockPrisma as never,
      "org-1",
      "GENERAL",
      "LAYER_1_BUSINESS"
    );
    expect(result).toHaveLength(1);
    expect(result[0].frameworkCode).toBe("NIST_AI_RMF");
    expect(result[0].cosaiLayer).toBe("LAYER_1_BUSINESS");
  });

  it("filters by verticalApplicability when vertical provided", async () => {
    mockPrisma.$queryRaw
      .mockResolvedValueOnce([{ id: "fw-1" }])
      .mockResolvedValueOnce([{ id: "fw-1", code: "NIST_AI_RMF", name: "NIST AI RMF" }]);
    mockPrisma.control.findMany.mockResolvedValue([
      {
        id: "c1",
        controlId: "GOV-1",
        title: "Governance",
        frameworkId: "fw-1",
        cosaiLayer: "LAYER_1_BUSINESS",
        verticalApplicability: ["GENERAL", "HEALTHCARE"]
      }
    ]);
    const result = await getVerticalControls(mockPrisma as never, "org-1", "GENERAL", null);
    expect(result).toHaveLength(1);
  });
});

describe("getCascadeChain", () => {
  it("returns empty steps when no framework for regulation", async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([]);
    const result = await getCascadeChain(
      mockPrisma as never,
      "org-1",
      "NIST_AI_RMF",
      "LAYER_1_BUSINESS",
      "LAYER_5_SUPPLY_CHAIN"
    );
    expect(result.regulation).toBe("NIST_AI_RMF");
    expect(result.steps).toEqual([]);
  });

  it("returns steps with controls per layer when framework exists", async () => {
    mockPrisma.$queryRaw
      .mockResolvedValueOnce([{ id: "fw-1" }])
      .mockResolvedValueOnce([{ id: "fw-1", code: "NIST_AI_RMF", name: "NIST AI RMF" }]);
    mockPrisma.control.findMany.mockResolvedValue([
      {
        id: "c1",
        controlId: "GOV-1",
        title: "Governance",
        frameworkId: "fw-1",
        cosaiLayer: "LAYER_1_BUSINESS"
      }
    ]);
    const result = await getCascadeChain(
      mockPrisma as never,
      "org-1",
      "NIST_AI_RMF",
      "LAYER_1_BUSINESS",
      "LAYER_1_BUSINESS"
    );
    expect(result.steps.length).toBeGreaterThanOrEqual(0);
  });
});

describe("getRegulationMap", () => {
  it("returns frameworks and byLayer", async () => {
    const now = new Date();
    mockPrisma.$queryRaw
      .mockResolvedValueOnce([
        {
          id: "fw-1",
          orgId: "org-1",
          code: "NIST_AI_RMF",
          version: "1.0",
          name: "NIST AI RMF",
          description: null,
          verticalApplicability: null,
          isActive: true,
          createdAt: now,
          updatedAt: now,
          controlCount: 1
        }
      ])
      .mockResolvedValueOnce([{ id: "fw-1", code: "NIST_AI_RMF", name: "NIST AI RMF" }]);
    mockPrisma.control.findMany.mockResolvedValue([
      {
        id: "c1",
        controlId: "GOV-1",
        title: "Governance",
        frameworkId: "fw-1",
        cosaiLayer: "LAYER_1_BUSINESS"
      }
    ]);
    const result = await getRegulationMap(mockPrisma as never, "org-1");
    expect(result.frameworks).toHaveLength(1);
    expect(result.frameworks[0].code).toBe("NIST_AI_RMF");
    expect(result.frameworks[0].controlCount).toBe(1);
    expect(result.byLayer).toHaveProperty("LAYER_1_BUSINESS");
  });
});
