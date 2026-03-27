import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { prisma } from "@/lib/prisma";
import { calculateKPI, calculateEUPenaltyExposure, type KpiName } from "@/lib/value/kpi-engine";
import { loadActiveFrameworksForOrg } from "@/lib/compliance/framework-queries";
import * as engine from "@/lib/compliance/engine";
import * as verticalCascade from "@/lib/compliance/vertical-cascade";
import { getExecutiveBriefingData } from "@/lib/executive-briefing";
import { enrichAuditFeedForDisplay } from "@/lib/audit/enrich-feed";
import { createTRPCRouter, protectedProcedure } from "../trpc";

const COSAI_LAYERS = [
  "LAYER_1_BUSINESS",
  "LAYER_2_INFORMATION",
  "LAYER_3_APPLICATION",
  "LAYER_4_PLATFORM",
  "LAYER_5_SUPPLY_CHAIN"
] as const;

export const dashboardRouter = createTRPCRouter({
  getKPIs: protectedProcedure.query(async ({ ctx }) => {
    const context = { orgId: ctx.orgId, prisma };
    const [
      totalAssets,
      complianceScore,
      criticalRisks,
      euHighRisk,
      withoutAccountability,
      staleCards,
      failedScans,
      vendorsExpiring
    ] = await Promise.all([
      calculateKPI("TOTAL_AI_ASSETS", context),
      calculateKPI("COMPLIANCE_SCORE", context),
      calculateKPI("CRITICAL_RISKS", context),
      calculateKPI("EU_HIGH_RISK_ASSETS", context),
      calculateKPI("ASSETS_WITHOUT_ACCOUNTABILITY", context),
      calculateKPI("STALE_CARDS", context),
      calculateKPI("FAILED_SCAN_POLICIES", context),
      calculateKPI("VENDORS_EXPIRING", context)
    ]);

    return {
      data: {
        totalAssets,
        complianceScore,
        criticalRisks,
        euHighRisk,
        withoutAccountability,
        staleCards,
        failedScans,
        vendorsExpiring
      },
      meta: {}
    };
  }),

  getKPIDeltas: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [assetsThisMonth, risksThisMonth, vendorsExpiringNow] = await Promise.all([
      prisma.aIAsset.count({
        where: { orgId: ctx.orgId, deletedAt: null, createdAt: { gte: monthStart } }
      }),
      prisma.riskRegister.count({
        where: {
          orgId: ctx.orgId,
          deletedAt: null,
          createdAt: { gte: weekAgo },
          OR: [{ riskScore: { gte: 15 } }, { residualScore: { gte: 15 } }]
        }
      }),
      prisma.vendorAssurance.count({ where: { orgId: ctx.orgId } })
    ]);

    return {
      data: {
        totalAssetsDelta: assetsThisMonth > 0 ? `+${assetsThisMonth} this month` : null,
        criticalRisksDelta: risksThisMonth > 0 ? `↑${risksThisMonth} since last week` : null,
        vendorsExpiringDelta: vendorsExpiringNow > 0 ? `${vendorsExpiringNow} need review` : null
      },
      meta: {}
    };
  }),

  getLayerPosture: protectedProcedure.query(async ({ ctx }) => {
    const assets = await prisma.aIAsset.findMany({
      where: { orgId: ctx.orgId, deletedAt: null },
      select: { id: true }
    });

    const layers: {
      layer: string;
      compliancePct: number;
      riskCount: number;
      accountableOwner: string | null;
      lastReviewed: Date | null;
    }[] = [];

    for (const layer of COSAI_LAYERS) {
      const assignments = await prisma.accountabilityAssignment.findMany({
        where: { asset: { orgId: ctx.orgId, deletedAt: null }, cosaiLayer: layer },
        take: 1,
        orderBy: { updatedAt: "desc" }
      });

      let complianceSum = 0;
      let count = 0;
      for (const a of assets) {
        const r = await engine.calculateComplianceScore(prisma, a.id);
        const layerData = r.byLayer[layer];
        if (layerData) {
          complianceSum += layerData.percentage;
          count++;
        }
      }

      const risks = await prisma.riskRegister.count({
        where: { orgId: ctx.orgId, deletedAt: null, cosaiLayer: layer }
      });

      layers.push({
        layer,
        compliancePct: count > 0 ? Math.round(complianceSum / count) : 0,
        riskCount: risks,
        accountableOwner: assignments[0]?.accountableParty ?? null,
        lastReviewed: assignments[0]?.updatedAt ?? null
      });
    }

    return { data: layers, meta: {} };
  }),

  getComplianceHeatmap: protectedProcedure.query(async ({ ctx }) => {
    const frameworks = await loadActiveFrameworksForOrg(prisma, ctx.orgId);
    const assets = await prisma.aIAsset.findMany({
      where: { orgId: ctx.orgId, deletedAt: null },
      select: { id: true, assetType: true }
    });

    const rows: { framework: string; [assetType: string]: string | number }[] = [];
    for (const fw of frameworks) {
      const row: { framework: string; [assetType: string]: string | number } = {
        framework: fw.code
      };
      const byType: Record<string, number[]> = {};
      for (const a of assets) {
        const r = await engine.calculateComplianceScore(prisma, a.id, fw.id);
        if (!byType[a.assetType]) byType[a.assetType] = [];
        byType[a.assetType].push(r.percentage);
      }
      for (const [t, pcts] of Object.entries(byType)) {
        row[t] = pcts.length > 0 ? Math.round(pcts.reduce((s, p) => s + p, 0) / pcts.length) : 0;
      }
      rows.push(row);
    }
    return { data: rows, meta: {} };
  }),

  getRiskMatrix: protectedProcedure.query(async ({ ctx }) => {
    const risks = await prisma.riskRegister.findMany({
      where: { orgId: ctx.orgId, deletedAt: null },
      select: { likelihood: true, impact: true, riskScore: true, id: true, title: true }
    });

    const matrix: Record<string, { count: number; risks: { id: string; title: string }[] }> = {};
    for (let l = 1; l <= 5; l++) {
      for (let i = 1; i <= 5; i++) {
        const key = `${l}-${i}`;
        const cell = risks.filter((r) => (r.likelihood ?? 0) === l && (r.impact ?? 0) === i);
        matrix[key] = {
          count: cell.length,
          risks: cell.map((r) => ({ id: r.id, title: r.title }))
        };
      }
    }
    return { data: matrix, meta: {} };
  }),

  getRegulatoryCascadeStatus: protectedProcedure.query(async ({ ctx }) => {
    const map = await verticalCascade.getRegulationMap(prisma, ctx.orgId);
    const assets = await prisma.aIAsset.findMany({
      where: { orgId: ctx.orgId, deletedAt: null },
      select: { id: true }
    });
    const org = await prisma.organization.findFirst({
      where: { id: ctx.orgId },
      select: { verticalMarket: true }
    });

    let totalRequirements = 0;
    let met = 0;
    for (const layer of Object.keys(map.byLayer)) {
      const controls = map.byLayer[layer] ?? [];
      totalRequirements += controls.length * Math.max(1, assets.length);
      for (const a of assets) {
        const r = await engine.calculateComplianceScore(prisma, a.id);
        const layerPct = r.byLayer[layer]?.percentage ?? 0;
        met += Math.round((controls.length * layerPct) / 100);
      }
    }

    return {
      data: {
        totalRequirements,
        met,
        pct: totalRequirements > 0 ? Math.round((met / totalRequirements) * 100) : 100,
        frameworks: map.frameworks
      },
      meta: {}
    };
  }),

  getTopGaps: protectedProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const assets = await prisma.aIAsset.findMany({
        where: { orgId: ctx.orgId, deletedAt: null },
        select: { id: true, name: true }
      });

      const allGaps: {
        assetId: string;
        assetName: string;
        controlId: string;
        title: string;
        cosaiLayer: string | null;
      }[] = [];
      for (const a of assets) {
        const report = await engine.getGapAnalysis(prisma, a.id);
        for (const g of report.criticalGaps) {
          allGaps.push({
            assetId: a.id,
            assetName: a.name,
            controlId: g.controlId,
            title: g.title,
            cosaiLayer: g.cosaiLayer
          });
        }
      }

      return {
        data: allGaps.slice(0, input?.limit ?? 5),
        meta: {}
      };
    }),

  getVendorAssuranceSummary: protectedProcedure.query(async ({ ctx }) => {
    const vendors = await prisma.vendorAssurance.findMany({
      where: { orgId: ctx.orgId }
    });
    const { assessVendorPosture, checkEvidenceCurrency } =
      await import("@/lib/supply-chain/assurance");

    const withScores = await Promise.all(
      vendors.map(async (v) => {
        const score = await assessVendorPosture(prisma, ctx.orgId, v.id);
        const expired = await checkEvidenceCurrency(prisma, ctx.orgId, v.id);
        return {
          id: v.id,
          name: v.vendorName,
          score: score.total,
          expiredCount: expired.length,
          nextReviewAt: v.nextReviewAt
        };
      })
    );

    return { data: withScores, meta: {} };
  }),

  getAuditFeed: protectedProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const entries = await prisma.auditLog.findMany({
        where: { orgId: ctx.orgId },
        orderBy: { createdAt: "desc" },
        take: input?.limit ?? 20
      });
      const data = await enrichAuditFeedForDisplay(prisma, ctx.orgId, entries);
      return { data, meta: {} };
    }),

  getTopRisksByLayer: protectedProcedure.query(async ({ ctx }) => {
    const risks = await prisma.riskRegister.findMany({
      where: { orgId: ctx.orgId, deletedAt: null, cosaiLayer: { not: null } },
      select: { cosaiLayer: true, title: true, riskScore: true },
      orderBy: { riskScore: "desc" }
    });
    const byLayer: Record<string, { title: string; riskScore: number | null }> = {};
    for (const r of risks) {
      const layer = r.cosaiLayer!;
      if (!(layer in byLayer)) byLayer[layer] = { title: r.title, riskScore: r.riskScore };
    }
    return { data: byLayer, meta: {} };
  }),

  getEUPenaltyExposure: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.role !== "CAIO" && ctx.role !== "ADMIN") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "EU penalty exposure requires CAIO or ADMIN role"
      });
    }
    const exp = await calculateEUPenaltyExposure(prisma, ctx.orgId);
    return { data: exp, meta: {} };
  }),

  /** Executive briefing – CEO-facing traffic lights. Includes penalty for org context. */
  getExecutiveBriefing: protectedProcedure.query(async ({ ctx }) => {
    const data = await getExecutiveBriefingData(prisma, ctx.orgId);
    return { data, meta: {} };
  }),

  getSankeyData: protectedProcedure.query(async ({ ctx }) => {
    const orgId = ctx.orgId;

    const [
      governancePolicyCount,
      lineageCount,
      masterDataCount,
      assetCount,
      assetsWithScans,
      l4VendorCount,
      l5VendorCount,
      risksByLayer
    ] = await Promise.all([
      prisma.dataGovernancePolicy.count({ where: { orgId } }),
      prisma.dataLineageRecord.count({
        where: { orgId, sourceEntityId: { not: null }, targetAssetId: { not: null } }
      }),
      prisma.masterDataEntity.count({ where: { orgId } }),
      prisma.aIAsset.count({ where: { orgId, deletedAt: null } }),
      prisma.scanRecord.groupBy({
        by: ["assetId"],
        where: { orgId }
      }),
      prisma.vendorAssurance.count({
        where: {
          orgId,
          OR: [
            { vendorType: "INFRASTRUCTURE" },
            { vendorType: "TOOLING" },
            { cosaiLayer: "LAYER_4_PLATFORM" }
          ]
        }
      }),
      prisma.vendorAssurance.count({
        where: {
          orgId,
          OR: [
            { vendorType: "MODEL_PROVIDER" },
            { vendorType: "DATA_PROVIDER" },
            { cosaiLayer: "LAYER_5_SUPPLY_CHAIN" }
          ]
        }
      }),
      prisma.riskRegister.findMany({
        where: { orgId, deletedAt: null, cosaiLayer: { not: null } },
        select: { cosaiLayer: true }
      })
    ]);

    const assetsWithPlatformDeps = assetsWithScans.length;
    const riskCountByLayer: Record<string, number> = {};
    for (const r of risksByLayer) {
      const layer = r.cosaiLayer!;
      riskCountByLayer[layer] = (riskCountByLayer[layer] ?? 0) + 1;
    }

    const LAYER_COLORS: Record<string, string> = {
      LAYER_1_BUSINESS: "#1D9E75",
      LAYER_2_INFORMATION: "#534AB7",
      LAYER_3_APPLICATION: "#D85A30",
      LAYER_4_PLATFORM: "#185FA5",
      LAYER_5_SUPPLY_CHAIN: "#5F5E5A"
    };

    const LAYER_LABELS: Record<string, string> = {
      LAYER_1_BUSINESS: "Business",
      LAYER_2_INFORMATION: "Information",
      LAYER_3_APPLICATION: "Application",
      LAYER_4_PLATFORM: "Platform",
      LAYER_5_SUPPLY_CHAIN: "Supply Chain"
    };

    const layerOrder = [
      "LAYER_1_BUSINESS",
      "LAYER_2_INFORMATION",
      "LAYER_3_APPLICATION",
      "LAYER_4_PLATFORM",
      "LAYER_5_SUPPLY_CHAIN"
    ];

    const assetCounts = [
      Math.max(1, governancePolicyCount),
      Math.max(1, masterDataCount),
      Math.max(1, assetCount),
      Math.max(1, l4VendorCount),
      Math.max(1, l5VendorCount)
    ];

    const nodes = layerOrder.map((layer, i) => ({
      id: `L${i + 1}`,
      label: LAYER_LABELS[layer],
      assetCount: assetCounts[i],
      complianceScore: 75,
      riskCount: riskCountByLayer[layer] ?? 0,
      color: LAYER_COLORS[layer]
    }));

    const links = [
      { source: "L1", target: "L2", value: Math.max(5, governancePolicyCount) },
      { source: "L2", target: "L3", value: Math.max(5, lineageCount) },
      { source: "L3", target: "L4", value: Math.max(5, assetsWithPlatformDeps) },
      { source: "L4", target: "L5", value: Math.max(5, l5VendorCount) }
    ];

    return { data: { nodes, links }, meta: {} };
  })
});
