/**
 * Layer 2 – Information – master data, lineage, governance, prompts, shadow AI.
 */
import { z } from "zod";
import type { MasterDataEntityType, DataClassification, AiAccessPolicy } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createTRPCRouter, protectedProcedure } from "../trpc";

const entityTypeSchema = z.enum(["CUSTOMER", "PRODUCT", "VENDOR", "EMPLOYEE", "FINANCE", "LOCATION", "OTHER"]);
const classificationSchema = z.enum(["PUBLIC", "INTERNAL", "CONFIDENTIAL", "RESTRICTED"]);
const aiAccessSchema = z.enum(["OPEN", "GOVERNED", "RESTRICTED", "PROHIBITED"]);

export const layer2Router = createTRPCRouter({
  getL2Summary: protectedProcedure.query(async ({ ctx }) => {
    const [entities, lineage, policies] = await Promise.all([
      prisma.masterDataEntity.findMany({
        where: { orgId: ctx.orgId },
        select: {
          id: true,
          classification: true,
          aiAccessPolicy: true,
          stewardId: true
        }
      }),
      prisma.dataLineageRecord.count({ where: { orgId: ctx.orgId } }),
      prisma.dataGovernancePolicy.count({ where: { orgId: ctx.orgId } })
    ]);

    const byClassification = entities.reduce(
      (acc, e) => {
        acc[e.classification] = (acc[e.classification] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    const byAiAccess = entities.reduce(
      (acc, e) => {
        acc[e.aiAccessPolicy] = (acc[e.aiAccessPolicy] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    const withSteward = entities.filter((e) => e.stewardId).length;
    const withClassification = entities.filter((e) => e.classification).length;
    const stewardshipPct = entities.length > 0 ? Math.round((withSteward / entities.length) * 100) : 0;
    const governanceCoveragePct =
      entities.length > 0
        ? Math.round(
            (entities.filter((e) => e.classification && e.stewardId).length / entities.length) * 100
          )
        : 0;
    const overexposureCount = entities.filter(
      (e) =>
        e.classification === "RESTRICTED" &&
        (e.aiAccessPolicy === "OPEN" || e.aiAccessPolicy === "GOVERNED")
    ).length;

    return {
      data: {
        totalEntities: entities.length,
        totalLineage: lineage,
        totalPolicies: policies,
        byClassification,
        byAiAccess,
        stewardshipPct,
        governanceCoveragePct,
        overexposureCount,
        withClassification,
        withSteward
      },
      meta: {}
    };
  }),

  getMasterDataEntities: protectedProcedure
    .input(
      z
        .object({
          entityType: entityTypeSchema.optional(),
          classification: classificationSchema.optional(),
          aiAccessPolicy: aiAccessSchema.optional()
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const where: {
        orgId: string;
        entityType?: MasterDataEntityType;
        classification?: DataClassification;
        aiAccessPolicy?: AiAccessPolicy;
      } = { orgId: ctx.orgId };
      if (input?.entityType) where.entityType = input.entityType as MasterDataEntityType;
      if (input?.classification) where.classification = input.classification as DataClassification;
      if (input?.aiAccessPolicy) where.aiAccessPolicy = input.aiAccessPolicy as AiAccessPolicy;

      const entities = await prisma.masterDataEntity.findMany({
        where,
        include: { steward: { select: { email: true } } },
        orderBy: { name: "asc" }
      });
      return { data: entities, meta: {} };
    }),

  createMasterDataEntity: protectedProcedure
    .input(
      z.object({
        entityType: entityTypeSchema,
        name: z.string().min(1),
        description: z.string().optional(),
        stewardId: z.string().optional(),
        classification: classificationSchema.default("INTERNAL"),
        qualityScore: z.number().min(0).max(100).optional(),
        recordCount: z.number().int().optional(),
        sourceSystem: z.string().optional(),
        aiAccessPolicy: aiAccessSchema.default("RESTRICTED")
      })
    )
    .mutation(async ({ ctx, input }) => {
      const e = await prisma.masterDataEntity.create({
        data: { orgId: ctx.orgId, ...input },
        include: { steward: { select: { email: true } } }
      });
      return { data: e, meta: {} };
    }),

  updateMasterDataEntity: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        stewardId: z.string().nullable().optional(),
        classification: classificationSchema.optional(),
        aiAccessPolicy: aiAccessSchema.optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      const existing = await prisma.masterDataEntity.findFirst({
        where: { id, orgId: ctx.orgId }
      });
      if (!existing) throw new Error("Entity not found");
      const updated = await prisma.masterDataEntity.update({
        where: { id },
        data: updates,
        include: { steward: { select: { email: true } } }
      });
      return { data: updated, meta: {} };
    }),

  getLineageRecords: protectedProcedure.query(async ({ ctx }) => {
    const records = await prisma.dataLineageRecord.findMany({
      where: { orgId: ctx.orgId },
      include: {
        sourceEntity: { select: { id: true, name: true } },
        targetAsset: { select: { id: true, name: true } },
        owner: { select: { email: true } }
      },
      orderBy: { name: "asc" }
    });
    return { data: records, meta: {} };
  }),

  getLineageDiagramData: protectedProcedure.query(async ({ ctx }) => {
    const [entities, assets, lineage] = await Promise.all([
      prisma.masterDataEntity.findMany({
        where: { orgId: ctx.orgId },
        select: { id: true, name: true }
      }),
      prisma.aIAsset.findMany({
        where: { orgId: ctx.orgId, deletedAt: null },
        select: { id: true, name: true }
      }),
      prisma.dataLineageRecord.findMany({
        where: { orgId: ctx.orgId },
        select: {
          id: true,
          name: true,
          pipelineType: true,
          sourceEntityId: true,
          targetAssetId: true
        }
      })
    ]);
    return {
      data: { entities, assets, lineage },
      meta: {}
    };
  }),

  createLineageRecord: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        sourceEntityId: z.string().optional(),
        targetAssetId: z.string().optional(),
        pipelineType: z.string().min(1),
        transformations: z.string().optional(),
        refreshFrequency: z.string().optional(),
        dataClassification: classificationSchema.default("INTERNAL")
      })
    )
    .mutation(async ({ ctx, input }) => {
      const r = await prisma.dataLineageRecord.create({
        data: { orgId: ctx.orgId, ...input },
        include: {
          sourceEntity: { select: { name: true } },
          targetAsset: { select: { name: true } },
          owner: { select: { email: true } }
        }
      });
      return { data: r, meta: {} };
    }),

  getGovernancePolicies: protectedProcedure.query(async ({ ctx }) => {
    const policies = await prisma.dataGovernancePolicy.findMany({
      where: { orgId: ctx.orgId },
      include: { owner: { select: { email: true } } },
      orderBy: { name: "asc" }
    });
    return { data: policies, meta: {} };
  }),

  getGovernanceCoverage: protectedProcedure.query(async ({ ctx }) => {
    const entities = await prisma.masterDataEntity.findMany({
      where: { orgId: ctx.orgId },
      select: { classification: true, stewardId: true, aiAccessPolicy: true }
    });
    const policies = await prisma.dataGovernancePolicy.findMany({
      where: { orgId: ctx.orgId, status: "APPROVED" }
    });

    const withClassification = entities.filter((e) => e.classification).length;
    const withSteward = entities.filter((e) => e.stewardId).length;
    const withBoth = entities.filter((e) => e.classification && e.stewardId).length;
    const total = entities.length;
    const governanceCoveragePct = total > 0 ? Math.round((withBoth / total) * 100) : 0;

    const confidentialRestricted = entities.filter(
      (e) => e.classification === "CONFIDENTIAL" || e.classification === "RESTRICTED"
    );
    const applicablePolicies = policies.filter(
      (p) =>
        p.appliesTo.includes("CONFIDENTIAL") || p.appliesTo.includes("RESTRICTED")
    );
    const coveredCount = confidentialRestricted.filter((e) =>
      applicablePolicies.some((p) => p.appliesTo.includes(e.classification))
    ).length;
    const policyCoveragePct =
      confidentialRestricted.length > 0
        ? Math.round((coveredCount / confidentialRestricted.length) * 100)
        : 0;

    const overexposureCount = entities.filter(
      (e) =>
        e.classification === "RESTRICTED" &&
        (e.aiAccessPolicy === "OPEN" || e.aiAccessPolicy === "GOVERNED")
    ).length;

    return {
      data: {
        governanceCoveragePct,
        policyCoveragePct,
        overexposureCount,
        withClassification,
        withSteward,
        total
      },
      meta: {}
    };
  }),

  getClassificationMatrix: protectedProcedure.query(async ({ ctx }) => {
    const entities = await prisma.masterDataEntity.findMany({
      where: { orgId: ctx.orgId },
      select: { entityType: true, aiAccessPolicy: true }
    });
    const entityTypes = ["CUSTOMER", "PRODUCT", "VENDOR", "EMPLOYEE", "FINANCE", "LOCATION", "OTHER"] as const;
    const assetTypes = ["MODEL", "AGENT", "APPLICATION"] as const;
    const matrix: Record<string, Record<string, string>> = {};
    for (const et of entityTypes) {
      matrix[et] = {};
      const entitiesOfType = entities.filter((e) => e.entityType === et);
      const policy = entitiesOfType[0]?.aiAccessPolicy ?? "RESTRICTED";
      for (const at of assetTypes) {
        matrix[et][at] = policy;
      }
    }
    return { data: { matrix, entityTypes, assetTypes }, meta: {} };
  }),

  createGovernancePolicy: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        policyType: z.enum(["CLASSIFICATION", "RETENTION", "ACCESS", "QUALITY", "PRIVACY"]),
        description: z.string().min(1),
        appliesTo: z.array(classificationSchema),
        controls: z.array(z.string()),
        ownerId: z.string().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const p = await prisma.dataGovernancePolicy.create({
        data: {
          orgId: ctx.orgId,
          ...input,
          controls: input.controls,
          appliesTo: input.appliesTo as DataClassification[]
        },
        include: { owner: { select: { email: true } } }
      });
      return { data: p, meta: {} };
    }),

  updateGovernancePolicy: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["DRAFT", "APPROVED"]).optional(),
        approvedAt: z.date().nullable().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.dataGovernancePolicy.findFirst({
        where: { id: input.id, orgId: ctx.orgId }
      });
      if (!existing) throw new Error("Policy not found");
      const { id, ...updates } = input;
      const p = await prisma.dataGovernancePolicy.update({
        where: { id },
        data: updates,
        include: { owner: { select: { email: true } } }
      });
      return { data: p, meta: {} };
    }),

  linkDataSourcesToAsset: protectedProcedure
    .input(
      z.object({
        assetId: z.string(),
        sourceEntityIds: z.array(z.string())
      })
    )
    .mutation(async ({ ctx, input }) => {
      const asset = await prisma.aIAsset.findFirst({
        where: { id: input.assetId, orgId: ctx.orgId, deletedAt: null }
      });
      if (!asset) throw new Error("Asset not found");
      const records = await Promise.all(
        input.sourceEntityIds.map((entityId) =>
          prisma.dataLineageRecord.create({
            data: {
              orgId: ctx.orgId,
              name: `Link: ${entityId} → ${asset.name}`,
              sourceEntityId: entityId,
              targetAssetId: asset.id,
              pipelineType: "MANUAL"
            }
          })
        )
      );
      return { data: records, meta: {} };
    }),

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
