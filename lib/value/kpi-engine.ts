/**
 * KPI engine – calculate KPIs and EU AI Act penalty exposure.
 */
import type { PrismaClient } from "@prisma/client";

export type KpiName =
  | "TOTAL_AI_ASSETS"
  | "COMPLIANCE_SCORE"
  | "CRITICAL_RISKS"
  | "EU_HIGH_RISK_ASSETS"
  | "ASSETS_WITHOUT_ACCOUNTABILITY"
  | "STALE_CARDS"
  | "FAILED_SCAN_POLICIES"
  | "VENDORS_EXPIRING"
  | "ASSET_COVERAGE_RATE"
  | "COMPLIANCE_POSTURE_SCORE"
  | "ACCOUNTABILITY_COVERAGE"
  | "SCAN_COVERAGE_RATE"
  | "EU_PENALTY_EXPOSURE";

export type KpiContext = {
  orgId: string;
  prisma: PrismaClient;
};

/**
 * EU AI Act Article 99 penalty ranges (EUR).
 * Non-compliance with high-risk obligations.
 */
const EU_PENALTY_RANGES = {
  ART_5_PROHIBITED: { min: 35_000_000, max: 35_000_000, pct: 0.07 },
  ART_9_RISK_MGMT: { min: 7_500_000, max: 15_000_000, pct: 0.015 },
  ART_10_DATA_GOV: { min: 7_500_000, max: 15_000_000, pct: 0.015 },
  ART_13_TRANSPARENCY: { min: 7_500_000, max: 15_000_000, pct: 0.015 },
  ART_14_HUMAN_OVERSIGHT: { min: 7_500_000, max: 15_000_000, pct: 0.015 },
  ART_16_QUALITY: { min: 7_500_000, max: 15_000_000, pct: 0.015 },
  ART_52_LIMITED: { min: 7_500_000, max: 15_000_000, pct: 0.015 },
  DEFAULT: { min: 5_000_000, max: 15_000_000, pct: 0.01 }
} as const;

export type PenaltyExposure = {
  totalMin: number;
  totalMax: number;
  byArticle: { article: string; min: number; max: number; gapCount: number }[];
  highRiskAssetCount: number;
};

export async function calculateKPI(kpi: KpiName, context: KpiContext): Promise<number> {
  const { orgId, prisma } = context;

  switch (kpi) {
    case "TOTAL_AI_ASSETS":
      return prisma.aIAsset.count({ where: { orgId, deletedAt: null } });

    case "COMPLIANCE_SCORE": {
      const assets = await prisma.aIAsset.findMany({
        where: { orgId, deletedAt: null },
        select: { id: true }
      });
      if (assets.length === 0) return 0;
      const { calculateComplianceScore } = await import("@/lib/compliance/engine");
      let total = 0;
      for (const a of assets) {
        const r = await calculateComplianceScore(prisma, a.id);
        total += r.percentage;
      }
      return Math.round(total / assets.length);
    }

    case "CRITICAL_RISKS":
      return prisma.riskRegister.count({
        where: {
          orgId,
          deletedAt: null,
          OR: [{ riskScore: { gte: 15 } }, { residualScore: { gte: 15 } }]
        }
      });

    case "EU_HIGH_RISK_ASSETS":
      return prisma.aIAsset.count({
        where: { orgId, deletedAt: null, euRiskLevel: "HIGH" }
      });

    case "ASSETS_WITHOUT_ACCOUNTABILITY": {
      const assets = await prisma.aIAsset.findMany({
        where: { orgId, deletedAt: null },
        select: { id: true }
      });
      const withAssignments = await prisma.accountabilityAssignment.groupBy({
        by: ["assetId"],
        where: { assetId: { in: assets.map((a) => a.id) } }
      });
      const assignedIds = new Set(withAssignments.map((a) => a.assetId));
      return assets.filter((a) => !assignedIds.has(a.id)).length;
    }

    case "STALE_CARDS": {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return prisma.artifactCard.count({
        where: {
          orgId,
          OR: [{ lastSyncedAt: null }, { lastSyncedAt: { lt: thirtyDaysAgo } }]
        }
      });
    }

    case "FAILED_SCAN_POLICIES": {
      const { checkScanCompliance } = await import("@/lib/scanning/coverage");
      const assets = await prisma.aIAsset.findMany({
        where: { orgId, deletedAt: null },
        select: { id: true }
      });
      let failed = 0;
      for (const a of assets) {
        const r = await checkScanCompliance(prisma, a.id);
        if (!r.compliant) failed++;
      }
      return failed;
    }

    case "VENDORS_EXPIRING": {
      const { checkEvidenceCurrency } = await import("@/lib/supply-chain/assurance");
      const vendors = await prisma.vendorAssurance.findMany({
        where: { orgId },
        select: { id: true }
      });
      let expiring = 0;
      for (const v of vendors) {
        const expired = await checkEvidenceCurrency(prisma, orgId, v.id);
        if (expired.length > 0) expiring++;
      }
      return expiring;
    }

    case "ASSET_COVERAGE_RATE": {
      const total = await prisma.aIAsset.count({ where: { orgId, deletedAt: null } });
      if (total === 0) return 100;
      const withCards = await prisma.artifactCard.groupBy({
        by: ["assetId"],
        where: { orgId }
      });
      return Math.round((withCards.length / total) * 100);
    }

    case "COMPLIANCE_POSTURE_SCORE":
      return calculateKPI("COMPLIANCE_SCORE", context);

    case "ACCOUNTABILITY_COVERAGE": {
      const total = await prisma.aIAsset.count({ where: { orgId, deletedAt: null } });
      if (total === 0) return 100;
      const without = await calculateKPI("ASSETS_WITHOUT_ACCOUNTABILITY", context);
      return Math.round(((total - without) / total) * 100);
    }

    case "SCAN_COVERAGE_RATE": {
      const { checkScanCompliance } = await import("@/lib/scanning/coverage");
      const assets = await prisma.aIAsset.findMany({
        where: { orgId, deletedAt: null },
        select: { id: true }
      });
      if (assets.length === 0) return 100;
      let compliant = 0;
      for (const a of assets) {
        const r = await checkScanCompliance(prisma, a.id);
        if (r.compliant) compliant++;
      }
      return Math.round((compliant / assets.length) * 100);
    }

    case "EU_PENALTY_EXPOSURE": {
      const exp = await calculateEUPenaltyExposure(prisma, orgId);
      return Math.round((exp.totalMin + exp.totalMax) / 2 / 1_000_000);
    }

    default:
      return 0;
  }
}

export async function calculateEUPenaltyExposure(
  prisma: PrismaClient,
  orgId: string
): Promise<PenaltyExposure> {
  const highRiskAssets = await prisma.aIAsset.findMany({
    where: { orgId, deletedAt: null, euRiskLevel: "HIGH" }
  });

  const byArticle: PenaltyExposure["byArticle"] = [];
  let totalMin = 0;
  let totalMax = 0;

  const articles = [
    { key: "ART_9_RISK_MGMT", label: "Art. 9 Risk Mgmt" },
    { key: "ART_10_DATA_GOV", label: "Art. 10 Data Gov" },
    { key: "ART_13_TRANSPARENCY", label: "Art. 13 Transparency" },
    { key: "ART_14_HUMAN_OVERSIGHT", label: "Art. 14 Human Oversight" }
  ];

  for (const art of articles) {
    const range =
      EU_PENALTY_RANGES[art.key as keyof typeof EU_PENALTY_RANGES] ?? EU_PENALTY_RANGES.DEFAULT;
    const gapCount = highRiskAssets.length;
    const min = gapCount > 0 ? range.min : 0;
    const max = gapCount > 0 ? range.max : 0;
    byArticle.push({ article: art.label, min, max, gapCount });
    totalMin += min;
    totalMax += max;
  }

  return {
    totalMin,
    totalMax,
    byArticle,
    highRiskAssetCount: highRiskAssets.length
  };
}
