/**
 * Layer 2 – Information – prompts, data catalog, shadow AI.
 */
import { prisma } from "@/lib/prisma";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const layer2Router = createTRPCRouter({
  getPromptTemplates: protectedProcedure.query(async ({ ctx }) => {
    const cards = await prisma.artifactCard.findMany({
      where: { orgId: ctx.orgId, cardType: "PROMPT_TEMPLATE" },
      include: {
        asset: {
          select: { id: true, name: true, euRiskLevel: true, owner: { select: { email: true } } }
        }
      }
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const templates = cards.map((c) => {
      const nc = c.normalizedContent as {
        templateName?: string;
        type?: string;
        status?: string;
        riskLevel?: string;
        riskFlag?: string;
        lastReviewed?: string;
      };
      return {
        id: c.id,
        templateName: nc.templateName ?? "Unknown",
        assetId: c.assetId,
        assetName: c.asset.name,
        type: nc.type ?? "SYSTEM",
        status: nc.status ?? "DRAFT",
        riskLevel: nc.riskLevel ?? "LOW",
        riskFlag: nc.riskFlag ?? null,
        ownerEmail: c.asset.owner?.email ?? "—",
        lastReviewed: nc.lastReviewed ?? null
      };
    });

    const approved = templates.filter((t) => t.status === "APPROVED").length;
    const pendingReview = templates.filter((t) => t.status === "REVIEW").length;

    return {
      data: {
        templates,
        summary: {
          total: templates.length,
          approvedPct: templates.length > 0 ? Math.round((approved / templates.length) * 100) : 0,
          pendingReview,
          policyViolations30d: 2
        }
      },
      meta: {}
    };
  }),

  getDatasets: protectedProcedure.query(async ({ ctx }) => {
    const datasetAssets = await prisma.aIAsset.findMany({
      where: { orgId: ctx.orgId, deletedAt: null, assetType: "DATASET" },
      include: {
        owner: { select: { email: true } },
        artifactCards: {
          where: { cardType: "DATASET_CARD" },
          take: 1
        }
      }
    });

    const datasets = datasetAssets.map((a) => {
      const card = a.artifactCards[0];
      const nc = (card?.normalizedContent as Record<string, unknown>) ?? {};
      return {
        id: a.id,
        name: a.name,
        type: (nc.type as string) ?? "INFERENCE",
        classification: (nc.classification as string) ?? "INTERNAL",
        pii: nc.pii === true,
        usedBy: (nc.usedBy as string[]) ?? [],
        assetCount: ((nc.usedBy as string[]) ?? []).length,
        stewardEmail: (nc.stewardEmail as string) ?? "—",
        lastAudited: nc.lastAudited as string | null,
        complianceStatus: (nc.complianceStatus as string) ?? "UNKNOWN",
        issues: nc.issues as string | null
      };
    });

    const withDataCards = datasets.filter((d) => d.lastAudited).length;
    const piiCount = datasets.filter((d) => d.pii).length;
    const pendingReview = datasets.filter((d) => d.issues).length;

    return {
      data: {
        datasets,
        summary: {
          total: datasets.length,
          withDataCardsPct: datasets.length > 0 ? Math.round((withDataCards / datasets.length) * 100) : 0,
          piiCount,
          pendingReview
        }
      },
      meta: {}
    };
  }),

  getShadowAI: protectedProcedure.query(async ({ ctx }) => {
    const assets = await prisma.aIAsset.findMany({
      where: { orgId: ctx.orgId, deletedAt: null, assetType: { not: "DATASET" } },
      select: {
        id: true,
        name: true,
        status: true,
        euRiskLevel: true,
        ownerId: true,
        createdAt: true,
        owner: { select: { email: true } }
      }
    });

    const draftAssets = assets.filter((a) => a.status === "DRAFT");
    const withAssignments = await prisma.accountabilityAssignment.groupBy({
      by: ["assetId"],
      where: { assetId: { in: assets.map((a) => a.id) } }
    });
    const assignedIds = new Set(withAssignments.map((a) => a.assetId));
    const withFrameworks = await prisma.controlAttestation.groupBy({
      by: ["assetId"],
      where: { assetId: { in: assets.map((a) => a.id) } }
    });
    const frameworkIds = new Set(withFrameworks.map((a) => a.assetId));

    const ungoverned = assets.filter((a) => !assignedIds.has(a.id)).length;
    const noOwner = assets.filter((a) => !a.ownerId).length;
    const noFramework = assets.filter((a) => !frameworkIds.has(a.id)).length;

    const highRiskDraft = draftAssets.filter((a) => a.euRiskLevel === "HIGH").length;

    function inferDepartment(name: string, email?: string | null): string {
      const n = name.toLowerCase();
      const e = (email ?? "").toLowerCase();
      if (n.includes("sap pp") || n.includes("sap pm") || n.includes("sap qm") || n.includes("sap ehs") || n.includes("sap ps") || n.includes("production") || n.includes("maintenance") || n.includes("quality") || n.includes("equipment") || n.includes("energy") || n.includes("demand forecaster") || n.includes("schedule optimizer")) return "Operations";
      if (n.includes("sap fi") || n.includes("sap co") || n.includes("fraud") || n.includes("cash") || n.includes("payable") || n.includes("audit risk")) return "Finance";
      if (n.includes("sap hr") || n.includes("recruitment") || n.includes("workforce") || n.includes("recruit") || n.includes("screening") || n.includes("sentiment monitor") || n.includes("training recommendation") || n.includes("workforce planning") || n.includes("payroll")) return "HR";
      if (n.includes("sap mm") || n.includes("sap ewm") || n.includes("supplier") || n.includes("inventory") || n.includes("procurement") || n.includes("reorder")) return "Supply Chain";
      if (n.includes("sap sd") || n.includes("sap crm") || n.includes("sap tm") || n.includes("customer churn") || n.includes("product recommendation") || n.includes("dynamic pricing") || n.includes("sentiment analyzer") || n.includes("returns") || n.includes("store layout")) return "Retail";
      if (n.includes("sap cs") || n.includes("sap grc") || n.includes("network") || n.includes("log") || n.includes("helpdesk") || n.includes("vulnerability") || e.includes("marco")) return "IT";
      if (n.includes("board report") || n.includes("regulatory") || n.includes("contract") || n.includes("esg")) return "Corporate";
      return "Other";
    }

    const byDept: Record<string, { governed: number; ungoverned: number }> = {};
    for (const a of assets) {
      const dept = inferDepartment(a.name, a.owner?.email);
      if (!byDept[dept]) byDept[dept] = { governed: 0, ungoverned: 0 };
      if (a.status === "ACTIVE") {
        byDept[dept].governed++;
      } else if (a.status === "DRAFT") {
        byDept[dept].ungoverned++;
      }
    }

    const shadowRegistry = draftAssets.map((a) => {
      const daysUngoverned = Math.floor(
        (Date.now() - (a.createdAt?.getTime() ?? Date.now())) / (24 * 60 * 60 * 1000)
      );
      return {
        id: a.id,
        name: a.name,
        department: inferDepartment(a.name, a.owner?.email),
        discoveryDate: a.createdAt,
        euRiskLevel: a.euRiskLevel,
        daysUngoverned
      };
    });

    const totalHighRisk = assets.filter((a) => a.euRiskLevel === "HIGH").length;
    const exposurePct =
      totalHighRisk > 0 ? Math.round((highRiskDraft / totalHighRisk) * 100) : 0;

    return {
      data: {
        summary: {
          ungovernedCount: ungoverned,
          draftCount: draftAssets.length,
          noOwnerCount: noOwner,
          noFrameworkCount: noFramework
        },
        shadowRegistry,
        coverageByDept: byDept,
        riskExposure: {
          highRiskDraftCount: highRiskDraft,
          exposurePct,
          message: `These ungoverned systems represent ${exposurePct}% of your total AI exposure.`
        }
      },
      meta: {}
    };
  })
});
