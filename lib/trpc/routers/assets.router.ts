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
      select: { id: true, email: true }
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
    })
});
