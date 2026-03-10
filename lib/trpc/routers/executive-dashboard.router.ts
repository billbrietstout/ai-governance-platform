/**
 * Executive Dashboard – role-based views for Layer 1 Business.
 */
import type { PrismaClient } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { calculateEUPenaltyExposure } from "@/lib/value/kpi-engine";
import * as engine from "@/lib/compliance/engine";
import { checkScanCompliance } from "@/lib/scanning/coverage";
import { checkEvidenceCurrency } from "@/lib/supply-chain/assurance";
import {
  VERTICAL_REGULATIONS,
  orgVerticalToKey,
  assetAppliesToRegulation,
  type VerticalKey
} from "@/lib/vertical-regulations";
import { createTRPCRouter, protectedProcedure } from "../trpc";

const NINETY_DAYS_AGO = (() => {
  const d = new Date();
  d.setDate(d.getDate() - 90);
  return d;
})();

export const executiveDashboardRouter = createTRPCRouter({
  getCEOView: protectedProcedure.query(async ({ ctx }) => {
    const [ungovernedHighRisk, reputationalRisk, penaltyRes, incidents, governancePct] =
      await Promise.all([
        getUngovernedHighRisk(prisma, ctx.orgId),
        getReputationalRisk(prisma, ctx.orgId),
        ctx.role === "CAIO" || ctx.role === "ADMIN"
          ? calculateEUPenaltyExposure(prisma, ctx.orgId).catch(() => null)
          : Promise.resolve(null),
        prisma.securityEvent.count({
          where: { orgId: ctx.orgId, createdAt: { gte: NINETY_DAYS_AGO } }
        }),
        getGovernanceCoverage(prisma, ctx.orgId)
      ]);

    const assets = await prisma.aIAsset.findMany({
      where: { orgId: ctx.orgId, deletedAt: null },
      select: { id: true }
    });
    const highRiskCount = await prisma.aIAsset.count({
      where: { orgId: ctx.orgId, deletedAt: null, euRiskLevel: "HIGH" }
    });

    let posture: "red" | "amber" | "green" = "green";
    if (ungovernedHighRisk > 0 || reputationalRisk > 0 || governancePct < 50) posture = "red";
    else if (governancePct < 80 || incidents > 0) posture = "amber";

    const penaltyRange =
      penaltyRes && penaltyRes.highRiskAssetCount > 0
        ? `€${(penaltyRes.totalMin / 1_000_000).toFixed(1)}–${(penaltyRes.totalMax / 1_000_000).toFixed(1)}M`
        : "€0";

    return {
      data: {
        aiRiskExposure: ungovernedHighRisk,
        reputationalRisk,
        regulatoryExposure: penaltyRange,
        penaltyMin: penaltyRes?.totalMin ?? 0,
        penaltyMax: penaltyRes?.totalMax ?? 0,
        aiIncidents: incidents,
        governanceCoverage: governancePct,
        posture,
        summary: `You have ${ungovernedHighRisk} high-risk AI systems with incomplete governance. Your largest regulatory exposure is EU AI Act at ${penaltyRange}.`
      },
      meta: {}
    };
  }),

  getCFOView: protectedProcedure.query(async ({ ctx }) => {
    const [penaltyRes, auditRisk, aiSpendGovernance, failedScans] = await Promise.all([
      ctx.role === "CAIO" || ctx.role === "ADMIN"
        ? calculateEUPenaltyExposure(prisma, ctx.orgId).catch(() => null)
        : Promise.resolve(null),
      getAuditRisk(prisma, ctx.orgId),
      getAiSpendGovernance(prisma, ctx.orgId),
      getFailedScanCount(prisma, ctx.orgId)
    ]);

    const assetsByAutonomy = await prisma.aIAsset.groupBy({
      by: ["autonomyLevel"],
      where: { orgId: ctx.orgId, deletedAt: null },
      _count: true
    });

    return {
      data: {
        complianceCostExposure:
          penaltyRes && penaltyRes.highRiskAssetCount > 0
            ? {
                min: penaltyRes.totalMin,
                max: penaltyRes.totalMax,
                range: `€${(penaltyRes.totalMin / 1_000_000).toFixed(1)}–${(penaltyRes.totalMax / 1_000_000).toFixed(1)}M`
              }
            : null,
        assetsByAutonomy: assetsByAutonomy.reduce(
          (acc, r) => {
            acc[r.autonomyLevel ?? "UNSET"] = r._count;
            return acc;
          },
          {} as Record<string, number>
        ),
        auditRisk,
        aiSpendGovernance,
        failedScanCount: failedScans
      },
      meta: {}
    };
  }),

  getCOOView: protectedProcedure.query(async ({ ctx }) => {
    const assets = await prisma.aIAsset.findMany({
      where: { orgId: ctx.orgId, deletedAt: null },
      select: { id: true, name: true, autonomyLevel: true, status: true }
    });

    const withAssignments = await prisma.accountabilityAssignment.groupBy({
      by: ["assetId"],
      where: { assetId: { in: assets.map((a) => a.id) } }
    });
    const assignedIds = new Set(withAssignments.map((w) => w.assetId));

    const byFunction = inferBusinessFunctions(assets, assignedIds);
    const shadowAiNoAccountability = assets.filter(
      (a) => a.status === "DRAFT" && !assignedIds.has(a.id)
    ).length;

    const autonomyDistribution = await prisma.aIAsset.groupBy({
      by: ["autonomyLevel"],
      where: { orgId: ctx.orgId, deletedAt: null },
      _count: true
    });

    const autonomousNoOversight = assets.filter(
      (a) =>
        (a.autonomyLevel === "AUTONOMOUS" || a.autonomyLevel === "SEMI_AUTONOMOUS") &&
        !assignedIds.has(a.id)
    ).length;

    return {
      data: {
        businessProcessCoverage: byFunction,
        shadowAiRisk: shadowAiNoAccountability,
        shadowAiDraftCount: assets.filter((a) => a.status === "DRAFT").length,
        autonomyDistribution: autonomyDistribution.reduce(
          (acc, r) => {
            acc[r.autonomyLevel ?? "UNSET"] = r._count;
            return acc;
          },
          {} as Record<string, number>
        ),
        humanOversightGaps: autonomousNoOversight
      },
      meta: {}
    };
  }),

  getCISOView: protectedProcedure.query(async ({ ctx }) => {
    const [failedScansByType, vendorsExpired, highRiskNoScan, promptInjectionFindings, securityEvents, externalFacing] =
      await Promise.all([
        getFailedScansByType(prisma, ctx.orgId),
        getVendorsExpiredCerts(prisma, ctx.orgId),
        getHighRiskNoScan90d(prisma, ctx.orgId),
        getPromptInjectionFindings(prisma, ctx.orgId),
        prisma.securityEvent.findMany({
          where: { orgId: ctx.orgId },
          orderBy: { createdAt: "desc" },
          take: 20
        }),
        getExternalFacingCount(prisma, ctx.orgId)
      ]);

    return {
      data: {
        failedScanPolicies: failedScansByType,
        vendorSecurityPosture: vendorsExpired,
        highRiskNoScan90d: highRiskNoScan,
        promptInjectionFindings,
        securityEventSummary: securityEvents.map((e) => ({
          id: e.id,
          eventType: e.eventType,
          email: e.email,
          createdAt: e.createdAt
        })),
        attackSurface: externalFacing
      },
      meta: {}
    };
  }),

  getVerticalPortfolio: protectedProcedure.query(async ({ ctx }) => {
    const org = await prisma.organization.findFirst({
      where: { id: ctx.orgId },
      select: { clientVerticals: true, verticalMarket: true }
    });
    const clientVerticals = (org?.clientVerticals as string[] | null) ?? [];
    const verticals: VerticalKey[] =
      clientVerticals.length > 0
      ? (clientVerticals.filter((v) => Object.keys(VERTICAL_REGULATIONS).includes(v)) as VerticalKey[])
      : [orgVerticalToKey(org?.verticalMarket ?? null)];

    const assets = await prisma.aIAsset.findMany({
      where: { orgId: ctx.orgId, deletedAt: null, assetType: { not: "DATASET" } },
      select: {
        id: true,
        name: true,
        assetType: true,
        description: true,
        clientVertical: true
      }
    });

    const attestationCounts = await Promise.all(
      assets.map(async (a) => {
        const compliant = await prisma.controlAttestation.count({
          where: { assetId: a.id, status: "COMPLIANT" }
        });
        return { assetId: a.id, compliant };
      })
    );
    const assetHasCompliant = new Map(attestationCounts.map((c, i) => [assets[i].id, c.compliant > 0]));

    const portfolio = verticals.map((vk) => {
      const profile = VERTICAL_REGULATIONS[vk];
      if (!profile) return null;

      const assetsInScope = assets.filter(
        (a) =>
          a.clientVertical === vk ||
          (a.clientVertical == null &&
            profile.regulations.some((r) => assetAppliesToRegulation(a, r)))
      );

      const regStatuses = profile.regulations.map((r) => {
        const inScope = assets.filter((a) =>
          (a.clientVertical === vk || a.clientVertical == null) && assetAppliesToRegulation(a, r)
        );
        if (inScope.length === 0) {
          return { regulation: r, status: "NOT_APPLICABLE" as const };
        }
        const allCompliant = inScope.every((a) => assetHasCompliant.get(a.id));
        const anyCompliant = inScope.some((a) => assetHasCompliant.get(a.id));
        let status: "COMPLIANT" | "GAP" | "UNKNOWN" | "NOT_APPLICABLE" = "UNKNOWN";
        if (allCompliant) status = "COMPLIANT";
        else if (!anyCompliant) status = "GAP";
        else status = "GAP";
        return { regulation: r, status };
      });

      const compliantRegs = regStatuses.filter((s) => s.status === "COMPLIANT").length;
      const applicableRegs = regStatuses.filter((s) => s.status !== "NOT_APPLICABLE").length;
      const score =
        applicableRegs > 0 ? Math.round((compliantRegs / applicableRegs) * 100) : 100;

      return {
        verticalKey: vk,
        label: profile.label,
        regulations: regStatuses,
        assetCount: assetsInScope.length,
        complianceScore: score
      };
    });

    return {
      /**data: { verticals: portfolio.filter(Boolean) },*/
      data: { verticals: portfolio.filter((v): v is NonNullable<typeof v> => v !== null) },
      meta: {}
    };
  }),

  getLegalCLOView: protectedProcedure.query(async ({ ctx }) => {
    const org = await prisma.organization.findFirst({
      where: { id: ctx.orgId },
      select: { verticalMarket: true }
    });
    const verticalKey = orgVerticalToKey(org?.verticalMarket ?? null);
    const profile = VERTICAL_REGULATIONS[verticalKey];

    const [annexIIIAssets, accountabilityCompleteness, noAppealsProcess, contractAlignmentGaps] =
      await Promise.all([
        getAnnexIIIAssets(prisma, ctx.orgId),
        getAccountabilityCompleteness(prisma, ctx.orgId),
        getNoAppealsProcess(prisma, ctx.orgId),
        getContractAlignmentGaps(prisma, ctx.orgId)
      ]);

    const verticalRegulations = profile
      ? profile.regulations.map((r) => ({
          ...r,
          status: "unknown" as "compliant" | "gap" | "unknown"
        }))
      : [];

    return {
      data: {
        annexIIIAssets,
        accountabilityCompleteness,
        noAppealsProcess,
        verticalRegulations,
        verticalKey,
        verticalLabel: profile?.label ?? "General",
        contractAlignmentGaps
      },
      meta: {}
    };
  })
});

async function getUngovernedHighRisk(prisma: PrismaClient, orgId: string): Promise<number> {
  const highRisk = await prisma.aIAsset.findMany({
    where: { orgId, deletedAt: null, euRiskLevel: "HIGH" },
    select: { id: true }
  });
  const withAssignments = await prisma.accountabilityAssignment.groupBy({
    by: ["assetId"],
    where: { assetId: { in: highRisk.map((a) => a.id) } }
  });
  const assignedIds = new Set(withAssignments.map((a) => a.assetId));
  const withCompliantAttestation = await Promise.all(
    highRisk.map(async (a) => {
      if (!assignedIds.has(a.id)) return false;
      const attestations = await prisma.controlAttestation.findMany({
        where: { assetId: a.id, status: "COMPLIANT" }
      });
      return attestations.length > 0;
    })
  );
  return highRisk.filter((_, i) => !withCompliantAttestation[i]).length;
}

async function getReputationalRisk(prisma: PrismaClient, orgId: string): Promise<number> {
  const autonomous = await prisma.aIAsset.findMany({
    where: {
      orgId,
      deletedAt: null,
      autonomyLevel: { in: ["AUTONOMOUS", "SEMI_AUTONOMOUS"] }
    },
    select: { id: true }
  });
  const withAssignments = await prisma.accountabilityAssignment.groupBy({
    by: ["assetId"],
    where: { assetId: { in: autonomous.map((a) => a.id) } }
  });
  const assignedIds = new Set(withAssignments.map((a) => a.assetId));
  return autonomous.filter((a) => !assignedIds.has(a.id)).length;
}

async function getGovernanceCoverage(prisma: PrismaClient, orgId: string): Promise<number> {
  const assets = await prisma.aIAsset.findMany({
    where: { orgId, deletedAt: null, status: "ACTIVE" },
    select: { id: true }
  });
  if (assets.length === 0) return 100;
  let withCompliant = 0;
  for (const a of assets) {
    const attestations = await prisma.controlAttestation.findMany({
      where: { assetId: a.id, status: "COMPLIANT" }
    });
    if (attestations.length > 0) withCompliant++;
  }
  return Math.round((withCompliant / assets.length) * 100);
}

async function getAuditRisk(prisma: PrismaClient, orgId: string): Promise<number> {
  const highRisk = await prisma.aIAsset.findMany({
    where: { orgId, deletedAt: null, euRiskLevel: "HIGH" },
    select: { id: true }
  });
  let noAttestation = 0;
  for (const a of highRisk) {
    const count = await prisma.controlAttestation.count({
      where: { assetId: a.id }
    });
    if (count === 0) noAttestation++;
  }
  return noAttestation;
}

async function getAiSpendGovernance(prisma: PrismaClient, orgId: string): Promise<number> {
  const vendors = await prisma.vendorAssurance.findMany({
    where: { orgId },
    select: { id: true, contractAligned: true }
  });
  if (vendors.length === 0) return 100;
  const aligned = vendors.filter((v) => v.contractAligned).length;
  return Math.round((aligned / vendors.length) * 100);
}

async function getFailedScanCount(prisma: PrismaClient, orgId: string): Promise<number> {
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

function inferBusinessFunctions(
  assets: Array<{ id: string; name: string; autonomyLevel: string | null }>,
  assignedIds: Set<string>
): Record<string, { total: number; governed: number; autonomous: number }> {
  const keywords: Record<string, string[]> = {
    Operations: ["production", "maintenance", "schedule", "inventory", "supply", "equipment", "quality"],
    Finance: ["fraud", "cash", "audit", "payable", "contract", "accounts"],
    HR: ["employee", "workforce", "training", "payroll", "screening", "cv", "resume", "hiring", "recruit"],
    Supply_Chain: ["supplier", "demand", "reorder", "inventory"],
    Retail: ["customer", "churn", "recommendation", "pricing", "store", "returns"],
    IT: ["network", "helpdesk", "vulnerability", "log"],
    Legal: ["legal", "contract", "regulatory", "esg"]
  };

  const result: Record<string, { total: number; governed: number; autonomous: number }> = {};
  for (const [fn] of Object.entries(keywords)) {
    result[fn] = { total: 0, governed: 0, autonomous: 0 };
  }
  result.Other = { total: 0, governed: 0, autonomous: 0 };

  for (const a of assets) {
    const name = (a.name ?? "").toLowerCase();
    const isAutonomous = a.autonomyLevel === "AUTONOMOUS" || a.autonomyLevel === "SEMI_AUTONOMOUS";
    const isGoverned = assignedIds.has(a.id);
    let matched = false;
    for (const [fn, kws] of Object.entries(keywords)) {
      if (kws.some((k) => name.includes(k))) {
        result[fn].total++;
        if (isGoverned) result[fn].governed++;
        if (isAutonomous) result[fn].autonomous++;
        matched = true;
        break;
      }
    }
    if (!matched) {
      result.Other.total++;
      if (isGoverned) result.Other.governed++;
      if (isAutonomous) result.Other.autonomous++;
    }
  }
  return result;
}

async function getFailedScansByType(
  prisma: PrismaClient,
  orgId: string
): Promise<Record<string, number>> {
  const assets = await prisma.aIAsset.findMany({
    where: { orgId, deletedAt: null },
    select: { id: true }
  });
  const byType: Record<string, number> = {};
  for (const a of assets) {
    const r = await checkScanCompliance(prisma, a.id);
    for (const st of r.overdue) {
      byType[st] = (byType[st] ?? 0) + 1;
    }
    for (const st of r.missing) {
      byType[st] = (byType[st] ?? 0) + 1;
    }
  }
  return byType;
}

async function getVendorsExpiredCerts(
  prisma: PrismaClient,
  orgId: string
): Promise<{ vendorName: string; soc2: boolean; iso: boolean }[]> {
  const vendors = await prisma.vendorAssurance.findMany({
    where: { orgId }
  });
  const result: { vendorName: string; soc2: boolean; iso: boolean }[] = [];
  for (const v of vendors) {
    const expired = await checkEvidenceCurrency(prisma, orgId, v.id);
    if (expired.length > 0) {
      result.push({
        vendorName: v.vendorName,
        soc2: v.soc2Status === "EXPIRED",
        iso: v.iso27001Status === "EXPIRED"
      });
    }
  }
  return result;
}


async function getHighRiskNoScan90d(prisma: PrismaClient, orgId: string): Promise<number> {
  const highRisk = await prisma.aIAsset.findMany({
    where: { orgId, deletedAt: null, euRiskLevel: "HIGH" },
    select: { id: true }
  });
  let count = 0;
  for (const a of highRisk) {
    const scans = await prisma.scanRecord.findMany({
      where: { assetId: a.id, completedAt: { gte: NINETY_DAYS_AGO } }
    });
    if (scans.length === 0) count++;
  }
  return count;
}

async function getPromptInjectionFindings(prisma: PrismaClient, orgId: string): Promise<number> {
  const records = await prisma.scanRecord.findMany({
    where: {
      orgId,
      scanType: "RED_TEAM"
    }
  });
  let count = 0;
  for (const r of records) {
    if (!r.findings) continue;
    const findings = r.findings as Record<string, unknown>[] | null;
    if (Array.isArray(findings)) {
      count += findings.filter(
        (f) =>
          typeof f === "object" &&
          f !== null &&
          (String((f as Record<string, unknown>).type ?? "").toLowerCase().includes("prompt") ||
            String((f as Record<string, unknown>).category ?? "").toLowerCase().includes("prompt"))
      ).length;
    }
  }
  return count;
}

async function getExternalFacingCount(prisma: PrismaClient, orgId: string): Promise<number> {
  const assets = await prisma.aIAsset.findMany({
    where: {
      orgId,
      deletedAt: null,
      OR: [
        { name: { contains: "customer", mode: "insensitive" } },
        { name: { contains: "chatbot", mode: "insensitive" } },
        { name: { contains: "recommendation", mode: "insensitive" } }
      ]
    }
  });
  return assets.length;
}

async function getAnnexIIIAssets(
  prisma: PrismaClient,
  orgId: string
): Promise<{ id: string; name: string; assetType: string; articles: string[] }[]> {
  const assets = await prisma.aIAsset.findMany({
    where: {
      orgId,
      deletedAt: null,
      OR: [
        { name: { contains: "screening", mode: "insensitive" } },
        { name: { contains: "employment", mode: "insensitive" } },
        { name: { contains: "credit", mode: "insensitive" } },
        { name: { contains: "medical", mode: "insensitive" } },
        { name: { contains: "biometric", mode: "insensitive" } },
        { name: { contains: "employee sentiment", mode: "insensitive" } }
      ]
    }
  });
  return assets.map((a) => ({
    id: a.id,
    name: a.name,
    assetType: a.assetType,
    articles: inferAnnexIIIArticles(a.name, a.description)
  }));
}

function inferAnnexIIIArticles(name: string, desc: string | null): string[] {
  const n = (name + " " + (desc ?? "")).toLowerCase();
  const articles: string[] = [];
  if (n.includes("screening") || n.includes("recruit") || n.includes("hiring"))
    articles.push("Art. 5(1)(a) Employment");
  if (n.includes("credit")) articles.push("Art. 5(1)(b) Credit");
  if (n.includes("medical")) articles.push("Art. 5(1)(c) Medical");
  if (n.includes("biometric")) articles.push("Art. 5(1)(d) Biometric");
  return articles;
}

async function getAccountabilityCompleteness(
  prisma: PrismaClient,
  orgId: string
): Promise<{ total: number; complete: number; pct: number }> {
  const highRisk = await prisma.aIAsset.findMany({
    where: { orgId, deletedAt: null, euRiskLevel: "HIGH" },
    select: { id: true }
  });
  let complete = 0;
  for (const a of highRisk) {
    const count = await prisma.accountabilityAssignment.count({
      where: { assetId: a.id }
    });
    if (count > 0) complete++;
  }
  return {
    total: highRisk.length,
    complete,
    pct: highRisk.length > 0 ? Math.round((complete / highRisk.length) * 100) : 100
  };
}

async function getNoAppealsProcess(prisma: PrismaClient, orgId: string): Promise<number> {
  const highRisk = await prisma.aIAsset.findMany({
    where: { orgId, deletedAt: null, euRiskLevel: "HIGH" },
    select: { id: true }
  });
  return highRisk.length;
}

async function getContractAlignmentGaps(prisma: PrismaClient, orgId: string): Promise<number> {
  const vendors = await prisma.vendorAssurance.findMany({
    where: { orgId }
  });
  return vendors.filter((v) => !v.contractAligned).length;
}
