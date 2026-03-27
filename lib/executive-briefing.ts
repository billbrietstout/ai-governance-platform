/**
 * Executive briefing data – shared between tRPC and weekly digest API.
 * CEO-facing traffic lights: Legal, Operational Safety, Readiness.
 */
import type { PrismaClient } from "@prisma/client";
import { calculateKPI } from "@/lib/value/kpi-engine";
import { calculateEUPenaltyExposure } from "@/lib/value/kpi-engine";
import * as engine from "@/lib/compliance/engine";

export type ExecutiveBriefingData = {
  compliancePct: number;
  penaltyMin: number;
  penaltyMax: number;
  euHighRisk: number;
  totalAssets: number;
  withoutAccountability: number;
  highRiskWithoutAccountability: number;
  maturityLevel: number;
  gapCount: number;
  missingControlsPct: number;
  assetsByRisk: Record<string, number>;
  lastUpdated: Date;
};

export async function getExecutiveBriefingData(
  prisma: PrismaClient,
  orgId: string
): Promise<ExecutiveBriefingData> {
  const [
    kpis,
    maturity,
    penalty,
    highRiskWithoutAccountability,
    assetsByRisk,
    lastAudit
  ] = await Promise.all([
    /**
     * One pass per asset: compliance % average + critical gap rows.
     * Avoids (layers × assets) compliance calls (timeouts on deploy) and duplicate
     * COMPLIANCE_SCORE + getGapAnalysis work per asset.
     */
    (async () => {
      const c = { orgId, prisma };
      const assets = await prisma.aIAsset.findMany({
        where: { orgId, deletedAt: null },
        select: { id: true, name: true }
      });
      const totalAssets = assets.length;
      let complianceSum = 0;
      const gapRows: { assetId: string; assetName: string }[] = [];
      for (const a of assets) {
        const r = await engine.calculateComplianceScore(prisma, a.id);
        complianceSum += r.percentage;
        for (const g of r.gaps) {
          if (g.status === "PENDING" || g.status === "NON_COMPLIANT") {
            gapRows.push({ assetId: a.id, assetName: a.name });
          }
        }
      }
      const complianceScore =
        totalAssets > 0 ? Math.round(complianceSum / totalAssets) : 0;
      const [withoutAcc, euHigh] = await Promise.all([
        calculateKPI("ASSETS_WITHOUT_ACCOUNTABILITY", c),
        calculateKPI("EU_HIGH_RISK_ASSETS", c)
      ]);
      return {
        totalAssets,
        complianceScore,
        withoutAccountability: withoutAcc,
        euHighRisk: euHigh,
        gapRows
      };
    })(),
    prisma.maturityAssessment.findFirst({
      where: { orgId },
      orderBy: { createdAt: "desc" },
      select: { maturityLevel: true, scores: true }
    }),
    calculateEUPenaltyExposure(prisma, orgId),
    (async () => {
      const highRisk = await prisma.aIAsset.findMany({
        where: { orgId, deletedAt: null, euRiskLevel: "HIGH" },
        select: { id: true }
      });
      if (highRisk.length === 0) return 0;
      const withAssignments = await prisma.accountabilityAssignment.groupBy({
        by: ["assetId"],
        where: { assetId: { in: highRisk.map((a) => a.id) } }
      });
      const assignedIds = new Set(withAssignments.map((a) => a.assetId));
      return highRisk.filter((a) => !assignedIds.has(a.id)).length;
    })(),
    prisma.aIAsset.groupBy({
      by: ["euRiskLevel"],
      where: { orgId, deletedAt: null },
      _count: true
    }),
    prisma.auditLog.findFirst({
      where: { orgId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true }
    })
  ]);

  const totalAssets = kpis.totalAssets;
  const gaps = kpis.gapRows;
  const missingControlsPct =
    totalAssets > 0 && gaps.length > 0 ? Math.round((gaps.length / (totalAssets * 5)) * 100) : 0;
  const byRisk: Record<string, number> = {};
  for (const g of assetsByRisk) {
    byRisk[g.euRiskLevel ?? "UNKNOWN"] = g._count;
  }

  return {
    compliancePct: kpis.complianceScore,
    penaltyMin: penalty.totalMin,
    penaltyMax: penalty.totalMax,
    euHighRisk: kpis.euHighRisk,
    totalAssets: kpis.totalAssets,
    withoutAccountability: kpis.withoutAccountability,
    highRiskWithoutAccountability: highRiskWithoutAccountability,
    maturityLevel: maturity?.maturityLevel ?? 1,
    gapCount: gaps.length,
    missingControlsPct,
    assetsByRisk: byRisk,
    lastUpdated: lastAudit?.createdAt ?? new Date()
  };
}
