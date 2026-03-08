import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { prisma } from "@/lib/prisma";
import {
  calculateKPI,
  calculateEUPenaltyExposure,
  type KpiName
} from "@/lib/value/kpi-engine";
import * as engine from "@/lib/compliance/engine";
import * as verticalCascade from "@/lib/compliance/vertical-cascade";
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
    const frameworks = await prisma.complianceFramework.findMany({
      where: { orgId: ctx.orgId, isActive: true },
      select: { id: true, code: true }
    });
    const assets = await prisma.aIAsset.findMany({
      where: { orgId: ctx.orgId, deletedAt: null },
      select: { id: true, assetType: true }
    });

    const rows: { framework: string; [assetType: string]: string | number }[] = [];
    for (const fw of frameworks) {
      const row: { framework: string; [assetType: string]: string | number } = { framework: fw.code };
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

      const allGaps: { assetId: string; assetName: string; controlId: string; title: string; cosaiLayer: string | null }[] = [];
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
    const { assessVendorPosture, checkEvidenceCurrency } = await import("@/lib/supply-chain/assurance");

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
      return { data: entries, meta: {} };
    }),

  getEUPenaltyExposure: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.role !== "CAIO" && ctx.role !== "ADMIN") {
      throw new TRPCError({ code: "FORBIDDEN", message: "EU penalty exposure requires CAIO or ADMIN role" });
    }
    const exp = await calculateEUPenaltyExposure(prisma, ctx.orgId);
    return { data: exp, meta: {} };
  })
});
