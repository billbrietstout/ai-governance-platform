/**
 * Executive briefing data – shared between tRPC and weekly digest API.
 * CEO-facing traffic lights: Legal, Operational Safety, Readiness.
 */
import type { PrismaClient } from "@prisma/client";
import { calculateKPI } from "@/lib/value/kpi-engine";
import { calculateEUPenaltyExposure } from "@/lib/value/kpi-engine";
import * as engine from "@/lib/compliance/engine";
import * as verticalCascade from "@/lib/compliance/vertical-cascade";

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
    cascade,
    penalty,
    gaps,
    highRiskWithoutAccountability,
    assetsByRisk,
    lastAudit
  ] = await Promise.all([
    (async () => {
      const c = { orgId, prisma };
      const [total, compliance, withoutAcc, euHigh] = await Promise.all([
        calculateKPI("TOTAL_AI_ASSETS", c),
        calculateKPI("COMPLIANCE_SCORE", c),
        calculateKPI("ASSETS_WITHOUT_ACCOUNTABILITY", c),
        calculateKPI("EU_HIGH_RISK_ASSETS", c)
      ]);
      return {
        totalAssets: total,
        complianceScore: compliance,
        withoutAccountability: withoutAcc,
        euHighRisk: euHigh
      };
    })(),
    prisma.maturityAssessment.findFirst({
      where: { orgId },
      orderBy: { createdAt: "desc" },
      select: { maturityLevel: true, scores: true }
    }),
    (async () => {
      const map = await verticalCascade.getRegulationMap(prisma, orgId);
      const assets = await prisma.aIAsset.findMany({
        where: { orgId, deletedAt: null },
        select: { id: true }
      });
      let total = 0,
        met = 0;
      for (const layer of Object.keys(map.byLayer)) {
        const controls = map.byLayer[layer] ?? [];
        total += controls.length * Math.max(1, assets.length);
        for (const a of assets) {
          const r = await engine.calculateComplianceScore(prisma, a.id);
          met += Math.round((controls.length * (r.byLayer[layer]?.percentage ?? 0)) / 100);
        }
      }
      return { pct: total > 0 ? Math.round((met / total) * 100) : 100 };
    })(),
    calculateEUPenaltyExposure(prisma, orgId),
    (async () => {
      const assets = await prisma.aIAsset.findMany({
        where: { orgId, deletedAt: null },
        select: { id: true, name: true }
      });
      const allGaps: { assetId: string; assetName: string }[] = [];
      for (const a of assets) {
        const report = await engine.getGapAnalysis(prisma, a.id);
        for (const g of report.criticalGaps) {
          allGaps.push({ assetId: a.id, assetName: a.name });
        }
      }
      return allGaps;
    })(),
    (async () => {
      const highRisk = await prisma.aIAsset.findMany({
        where: { orgId, deletedAt: null, euRiskLevel: "HIGH" },
        select: { id: true }
      });
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
  const missingControlsPct =
    totalAssets > 0 && gaps.length > 0 ? Math.round((gaps.length / (totalAssets * 5)) * 100) : 0;
  const byRisk: Record<string, number> = {};
  for (const g of assetsByRisk) {
    byRisk[g.euRiskLevel ?? "UNKNOWN"] = g._count;
  }

  return {
    compliancePct: cascade.pct,
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
