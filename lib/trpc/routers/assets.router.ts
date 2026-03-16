import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import type { AuditTransactionClient } from "@/lib/audit";
import * as engine from "@/lib/compliance/engine";
import { classifyEURiskLevel } from "@/lib/compliance/eu-ai-act";
import { createTRPCRouter, protectedProcedure } from "../trpc";

const assetTypeSchema = z.enum(["MODEL", "PROMPT", "AGENT", "DATASET", "APPLICATION", "TOOL", "PIPELINE"]);
const euRiskSchema = z.enum(["MINIMAL", "LIMITED", "HIGH", "UNACCEPTABLE"]).nullable();
const operatingModelSchema = z.enum(["IN_HOUSE", "VENDOR", "HYBRID"]).nullable();
const cosaiLayerSchema = z.enum(["LAYER_1_BUSINESS", "LAYER_2_INFORMATION", "LAYER_3_APPLICATION", "LAYER_4_PLATFORM", "LAYER_5_SUPPLY_CHAIN"]).nullable();
const autonomySchema = z.enum(["HUMAN_ONLY", "ASSISTED", "SEMI_AUTONOMOUS", "AUTONOMOUS"]).nullable();
const statusSchema = z.enum(["DRAFT", "ACTIVE", "DEPRECATED", "ARCHIVED"]);
const verticalSchema = z.enum(["GENERAL", "HEALTHCARE", "FINANCIAL", "INSURANCE", "AUTOMOTIVE", "RETAIL", "MANUFACTURING", "PUBLIC_SECTOR", "ENERGY"]).nullable();

export const assetsRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z
        .object({
          assetType: assetTypeSchema.optional(),
          euRiskLevel: euRiskSchema.optional(),
          cosaiLayer: cosaiLayerSchema.optional(),
          verticalMarket: verticalSchema.optional(),
          operatingModel: operatingModelSchema.optional(),
          status: statusSchema.optional()
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = { orgId: ctx.orgId, deletedAt: null };
      if (input?.assetType) where.assetType = input.assetType;
      if (input?.euRiskLevel != null) where.euRiskLevel = input.euRiskLevel;
      if (input?.cosaiLayer != null) where.cosaiLayer = input.cosaiLayer;
      if (input?.verticalMarket != null) where.verticalMarket = input.verticalMarket;
      if (input?.operatingModel != null) where.operatingModel = input.operatingModel;
      if (input?.status) where.status = input.status;

      const list = await prisma.aIAsset.findMany({
        where,
        include: { owner: { select: { id: true, email: true } } },
        orderBy: { name: "asc" }
      });

      const withCompliance = await Promise.all(
        list.map(async (a) => {
          const score = await engine.calculateComplianceScore(prisma, a.id);
          return { ...a, compliancePercentage: score.percentage };
        })
      );

      return { data: withCompliance, meta: {} };
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const asset = await prisma.aIAsset.findFirst({
        where: { id: input.id, orgId: ctx.orgId, deletedAt: null },
        include: { owner: { select: { id: true, email: true } } }
      });
      if (!asset) throw new TRPCError({ code: "NOT_FOUND", message: "Asset not found" });
      return { data: asset, meta: {} };
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        assetType: assetTypeSchema,
        euRiskLevel: euRiskSchema.optional(),
        operatingModel: operatingModelSchema.optional(),
        cosaiLayer: cosaiLayerSchema.optional(),
        autonomyLevel: autonomySchema.optional(),
        verticalMarket: verticalSchema.optional(),
        status: statusSchema.optional(),
        ownerId: z.string().optional(),
        createAccountability: z.boolean().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await prisma.$transaction(async (tx) => {
        const asset = await tx.aIAsset.create({
          data: {
            orgId: ctx.orgId,
            name: input.name,
            description: input.description,
            assetType: input.assetType,
            euRiskLevel: input.euRiskLevel ?? null,
            operatingModel: input.operatingModel ?? null,
            cosaiLayer: input.cosaiLayer ?? null,
            autonomyLevel: input.autonomyLevel ?? null,
            verticalMarket: input.verticalMarket ?? null,
            status: input.status ?? "DRAFT",
            ownerId: input.ownerId ?? null
          }
        });

        if (input.createAccountability && input.cosaiLayer) {
          await tx.accountabilityAssignment.create({
            data: {
              assetId: asset.id,
              componentName: input.name,
              cosaiLayer: input.cosaiLayer,
              accountableParty: "TBD",
              responsibleParty: "TBD"
            }
          });
        }

        await writeAuditLog({
          action: "CREATE",
          resourceType: "AIAsset",
          resourceId: asset.id,
          nextState: { name: asset.name, assetType: asset.assetType },
          context: { orgId: ctx.orgId, userId: ctx.userId },
          tx: tx as unknown as AuditTransactionClient
        });
        return asset;
      });
      return { data: result, meta: {} };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        assetType: assetTypeSchema.optional(),
        euRiskLevel: euRiskSchema.optional(),
        operatingModel: operatingModelSchema.optional(),
        cosaiLayer: cosaiLayerSchema.optional(),
        autonomyLevel: autonomySchema.optional(),
        verticalMarket: verticalSchema.optional(),
        status: statusSchema.optional(),
        ownerId: z.string().nullable().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.aIAsset.findFirst({
        where: { id: input.id, orgId: ctx.orgId, deletedAt: null }
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Asset not found" });

      const { id, ...data } = input;
      const result = await prisma.$transaction(async (tx) => {
        const asset = await tx.aIAsset.update({
          where: { id },
          data: {
            ...(data.name != null && { name: data.name }),
            ...(data.description != null && { description: data.description }),
            ...(data.assetType != null && { assetType: data.assetType }),
            ...(data.euRiskLevel != null && { euRiskLevel: data.euRiskLevel }),
            ...(data.operatingModel != null && { operatingModel: data.operatingModel }),
            ...(data.cosaiLayer != null && { cosaiLayer: data.cosaiLayer }),
            ...(data.autonomyLevel != null && { autonomyLevel: data.autonomyLevel }),
            ...(data.verticalMarket != null && { verticalMarket: data.verticalMarket }),
            ...(data.status != null && { status: data.status }),
            ...(data.ownerId !== undefined && { ownerId: data.ownerId })
          }
        });
        await writeAuditLog({
          action: "UPDATE",
          resourceType: "AIAsset",
          resourceId: asset.id,
          prevState: { name: existing.name },
          nextState: { name: asset.name },
          context: { orgId: ctx.orgId, userId: ctx.userId },
          tx: tx as unknown as AuditTransactionClient
        });
        return asset;
      });
      return { data: result, meta: {} };
    }),

  getOrgUsers: protectedProcedure.query(async ({ ctx }) => {
    const users = await prisma.user.findMany({
      where: { orgId: ctx.orgId },
      select: { id: true, email: true, role: true, persona: true }
    });
    return { data: users, meta: {} };
  }),

  getEURequirements: protectedProcedure
    .input(z.object({ euRiskLevel: euRiskSchema }))
    .query(({ input }) => {
      const result = classifyEURiskLevel({
        assetType: "APPLICATION",
        euRiskLevel: input.euRiskLevel ?? undefined
      });
      return { data: result, meta: {} };
    }),

  getAgentRegistry: protectedProcedure
    .input(
      z
        .object({
          autonomyLevel: autonomySchema.optional(),
          overrideTier: z.enum(["T1", "T2", "T3", "T4", "T5"]).optional(),
          status: statusSchema.optional()
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = { orgId: ctx.orgId, deletedAt: null };
      if (input?.autonomyLevel) where.autonomyLevel = input.autonomyLevel;
      if (input?.overrideTier) where.overrideTier = input.overrideTier;
      if (input?.status) where.status = input.status;

      const assets = await prisma.aIAsset.findMany({
        where,
        include: { owner: { select: { id: true, email: true } } },
        orderBy: { name: "asc" }
      });
      return { data: assets, meta: {} };
    }),

  updateAgentConfig: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        overrideTier: z.enum(["T1", "T2", "T3", "T4", "T5"]).nullable().optional(),
        toolAuthorizations: z.array(z.string()).optional(),
        oversightPolicy: z.string().nullable().optional(),
        humanOversightRequired: z.boolean().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.aIAsset.findFirst({
        where: { id: input.id, orgId: ctx.orgId, deletedAt: null }
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Asset not found" });

      const { id, ...data } = input;
      const result = await prisma.aIAsset.update({
        where: { id },
        data: {
          ...(data.overrideTier !== undefined && { overrideTier: data.overrideTier }),
          ...(data.toolAuthorizations !== undefined && { toolAuthorizations: data.toolAuthorizations }),
          ...(data.oversightPolicy !== undefined && { oversightPolicy: data.oversightPolicy }),
          ...(data.humanOversightRequired !== undefined && { humanOversightRequired: data.humanOversightRequired })
        },
        include: { owner: { select: { id: true, email: true } } }
      });
      return { data: result, meta: {} };
    }),

  promoteLifecycleStage: protectedProcedure
    .input(z.object({ id: z.string(), notes: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const asset = await prisma.aIAsset.findFirst({
        where: { id: input.id, orgId: ctx.orgId, deletedAt: null },
        include: {
          controlAttestations: { take: 1 },
          accountabilityAssignments: { take: 1 }
        }
      });
      if (!asset) throw new TRPCError({ code: "NOT_FOUND", message: "Asset not found" });

      const stages = ["DEVELOPMENT", "TESTING", "STAGING", "PRODUCTION", "DEPRECATED", "RETIRED"];
      const idx = stages.indexOf(asset.lifecycleStage);
      if (idx < 0 || idx >= stages.length - 1) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot promote from current stage" });
      }
      const nextStage = stages[idx + 1];

      if (asset.euRiskLevel === "HIGH" && nextStage === "PRODUCTION") {
        const [hasAttestation, hasAccountability] = await Promise.all([
          prisma.controlAttestation.count({ where: { assetId: asset.id } }).then((c) => c > 0),
          prisma.accountabilityAssignment.count({ where: { assetId: asset.id } }).then((c) => c > 0)
        ]);
        if (!hasAttestation || !hasAccountability) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "HIGH risk assets require control attestation and accountability assignment before production"
          });
        }
      }

      const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.aIAsset.update({
          where: { id: input.id },
          data: {
            lifecycleStage: nextStage,
            lifecycleUpdatedAt: new Date(),
            lifecycleUpdatedBy: ctx.userId
          }
        });
        await tx.assetLifecycleTransition.create({
          data: {
            assetId: input.id,
            fromStage: asset.lifecycleStage,
            toStage: nextStage,
            direction: "PROMOTE",
            userId: ctx.userId,
            notes: input.notes ?? null
          }
        });
        return updated;
      });
      return { data: result, meta: {} };
    }),

  demoteLifecycleStage: protectedProcedure
    .input(z.object({ id: z.string(), notes: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const asset = await prisma.aIAsset.findFirst({
        where: { id: input.id, orgId: ctx.orgId, deletedAt: null }
      });
      if (!asset) throw new TRPCError({ code: "NOT_FOUND", message: "Asset not found" });

      const stages = ["DEVELOPMENT", "TESTING", "STAGING", "PRODUCTION", "DEPRECATED", "RETIRED"];
      const idx = stages.indexOf(asset.lifecycleStage);
      if (idx <= 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot demote from current stage" });
      }
      const prevStage = stages[idx - 1];

      const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.aIAsset.update({
          where: { id: input.id },
          data: {
            lifecycleStage: prevStage,
            lifecycleUpdatedAt: new Date(),
            lifecycleUpdatedBy: ctx.userId
          }
        });
        await tx.assetLifecycleTransition.create({
          data: {
            assetId: input.id,
            fromStage: asset.lifecycleStage,
            toStage: prevStage,
            direction: "DEMOTE",
            userId: ctx.userId,
            notes: input.notes ?? null
          }
        });
        return updated;
      });
      return { data: result, meta: {} };
    }),

  getAssignmentSuggestions: protectedProcedure
    .input(z.object({ assetId: z.string() }))
    .query(async ({ ctx, input }) => {
      const [asset, users] = await Promise.all([
        prisma.aIAsset.findFirst({
          where: { id: input.assetId, orgId: ctx.orgId, deletedAt: null },
          select: {
            id: true,
            name: true,
            assetType: true,
            cosaiLayer: true,
            lifecycleUpdatedBy: true
          }
        }),
        prisma.user.findMany({
          where: { orgId: ctx.orgId },
          select: { id: true, email: true, role: true, persona: true }
        })
      ]);

      if (!asset) return { data: { suggestions: [], allUsers: users }, meta: {} };

      const L2_LAYERS = ["LAYER_2_INFORMATION"];
      const L4_LAYERS = ["LAYER_4_PLATFORM"];

      const ranked = users
        .map((user) => {
          let score = 0;
          let reason = "";

          if (user.id === asset.lifecycleUpdatedBy) {
            score += 40;
            reason = "Last updated this asset";
          }

          if (user.persona === "DEV_LEAD" && asset.assetType === "APPLICATION") {
            score += 30;
            reason = reason || "Development lead";
          }
          if (user.persona === "CAIO") {
            score += 20;
            reason = reason || "AI governance officer";
          }
          if (user.persona === "DATA_OWNER" && asset.cosaiLayer && L2_LAYERS.includes(asset.cosaiLayer)) {
            score += 25;
            reason = reason || "Data owner";
          }
          if (user.persona === "PLATFORM_ENG" && asset.cosaiLayer && L4_LAYERS.includes(asset.cosaiLayer)) {
            score += 25;
            reason = reason || "Platform engineer";
          }
          if (user.role === "ADMIN") {
            score += 10;
            reason = reason || "Organization admin";
          }

          return { ...user, score, reason };
        })
        .filter((u) => u.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

      return { data: { suggestions: ranked, allUsers: users }, meta: {} };
    }),

  getUnownedHighRiskAssets: protectedProcedure.query(async ({ ctx }) => {
    const highRisk = await prisma.aIAsset.findMany({
      where: { orgId: ctx.orgId, deletedAt: null, euRiskLevel: "HIGH" },
      select: { id: true, name: true, description: true, euRiskLevel: true, cosaiLayer: true }
    });
    const withAssignments = await prisma.accountabilityAssignment.groupBy({
      by: ["assetId"],
      where: { assetId: { in: highRisk.map((a) => a.id) } }
    });
    const assignedIds = new Set(withAssignments.map((a) => a.assetId));
    const unowned = highRisk.filter((a) => !assignedIds.has(a.id));
    return { data: unowned.slice(0, 5), meta: {} };
  }),

  getUnownedAssets: protectedProcedure.query(async ({ ctx }) => {
    const assets = await prisma.aIAsset.findMany({
      where: { orgId: ctx.orgId, deletedAt: null },
      select: { id: true, name: true, description: true, euRiskLevel: true, cosaiLayer: true }
    });
    const withAssignments = await prisma.accountabilityAssignment.groupBy({
      by: ["assetId"],
      where: { assetId: { in: assets.map((a) => a.id) } }
    });
    const assignedIds = new Set(withAssignments.map((a) => a.assetId));
    const unowned = assets.filter((a) => !assignedIds.has(a.id));
    return { data: unowned.slice(0, 5), meta: {} };
  }),

  getLifecycleBoard: protectedProcedure.query(async ({ ctx }) => {
    const assets = await prisma.aIAsset.findMany({
      where: { orgId: ctx.orgId, deletedAt: null },
      include: {
        owner: { select: { id: true, email: true } },
        lifecycleTransitions: { orderBy: { createdAt: "desc" }, take: 5 }
      },
      orderBy: { name: "asc" }
    });
    const byStage: Record<string, typeof assets> = {};
    const stages = ["DEVELOPMENT", "TESTING", "STAGING", "PRODUCTION", "DEPRECATED", "RETIRED"];
    for (const s of stages) byStage[s] = [];
    for (const a of assets) {
      const stage = a.lifecycleStage || "DEVELOPMENT";
      if (!byStage[stage]) byStage[stage] = [];
      byStage[stage].push(a);
    }
    return { data: { byStage, assets }, meta: {} };
  })
});
