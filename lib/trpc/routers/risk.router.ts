import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import type { AuditTransactionClient } from "@/lib/audit";
import { calculateRiskScore, getRiskRating } from "@/lib/risk/scorer";
import { createTRPCRouter, protectedProcedure } from "../trpc";

const riskStatusSchema = z.enum(["IDENTIFIED", "ASSESSING", "MITIGATING", "ACCEPTED", "CLOSED"]);
type RiskStatus = z.infer<typeof riskStatusSchema>;

export const riskRouter = createTRPCRouter({
  getRiskRegister: protectedProcedure
    .input(z.object({ assetId: z.string().optional(), status: riskStatusSchema.optional() }))
    .query(async ({ ctx, input }) => {
      const where: { orgId: string; deletedAt: null; assetId?: string; status?: RiskStatus } = {
        orgId: ctx.orgId,
        deletedAt: null
      };
      if (input.assetId) where.assetId = input.assetId;
      if (input.status) where.status = input.status;
      const list = await prisma.riskRegister.findMany({
        where,
        include: { asset: { select: { name: true } } },
        orderBy: { createdAt: "desc" }
      });
      return { data: list, meta: {} };
    }),

  createRisk: protectedProcedure
    .input(
      z.object({
        assetId: z.string(),
        title: z.string(),
        description: z.string().optional(),
        likelihood: z.number().min(1).max(5),
        impact: z.number().min(1).max(5),
        owner: z.string().optional(),
        cosaiLayer: z.string().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const asset = await prisma.aIAsset.findFirst({
        where: { id: input.assetId, orgId: ctx.orgId, deletedAt: null }
      });
      if (!asset) throw new TRPCError({ code: "NOT_FOUND", message: "Asset not found" });

      const riskScore = calculateRiskScore(input.likelihood, input.impact);

      const result = await prisma.$transaction(async (tx) => {
        const risk = await tx.riskRegister.create({
          data: {
            orgId: ctx.orgId,
            assetId: input.assetId,
            title: input.title,
            description: input.description,
            likelihood: input.likelihood,
            impact: input.impact,
            riskScore,
            owner: input.owner,
            cosaiLayer: input.cosaiLayer
              ? (input.cosaiLayer as
                  | "LAYER_1_BUSINESS"
                  | "LAYER_2_INFORMATION"
                  | "LAYER_3_APPLICATION"
                  | "LAYER_4_PLATFORM"
                  | "LAYER_5_SUPPLY_CHAIN")
              : null,
            status: "IDENTIFIED"
          }
        });
        await writeAuditLog({
          action: "CREATE",
          resourceType: "RiskRegister",
          resourceId: risk.id,
          nextState: { title: risk.title, riskScore },
          context: { orgId: ctx.orgId, userId: ctx.userId },
          tx: tx as unknown as AuditTransactionClient
        });
        return risk;
      });

      return { data: result, meta: {} };
    }),

  updateRisk: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        likelihood: z.number().min(1).max(5).optional(),
        impact: z.number().min(1).max(5).optional(),
        status: riskStatusSchema.optional(),
        owner: z.string().optional(),
        residualScore: z.number().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.riskRegister.findFirst({
        where: { id: input.id, orgId: ctx.orgId, deletedAt: null }
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Risk not found" });

      const riskScore =
        input.likelihood != null && input.impact != null
          ? calculateRiskScore(input.likelihood, input.impact)
          : (existing.riskScore ?? undefined);

      const result = await prisma.$transaction(async (tx) => {
        const risk = await tx.riskRegister.update({
          where: { id: input.id },
          data: {
            ...(input.title != null && { title: input.title }),
            ...(input.description != null && { description: input.description }),
            ...(input.likelihood != null && { likelihood: input.likelihood }),
            ...(input.impact != null && { impact: input.impact }),
            ...(riskScore != null && { riskScore }),
            ...(input.status != null && { status: input.status }),
            ...(input.owner != null && { owner: input.owner }),
            ...(input.residualScore != null && { residualScore: input.residualScore })
          }
        });
        await writeAuditLog({
          action: "UPDATE",
          resourceType: "RiskRegister",
          resourceId: risk.id,
          prevState: { status: existing.status },
          nextState: { status: risk.status },
          context: { orgId: ctx.orgId, userId: ctx.userId },
          tx: tx as unknown as AuditTransactionClient
        });
        return risk;
      });

      return { data: result, meta: {} };
    }),

  getRiskSummary: protectedProcedure
    .input(z.object({ assetId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const where: { orgId: string; deletedAt: null; assetId?: string } = {
        orgId: ctx.orgId,
        deletedAt: null
      };
      if (input.assetId) where.assetId = input.assetId;
      const list = await prisma.riskRegister.findMany({
        where,
        select: { riskScore: true, residualScore: true, status: true }
      });
      const byRating = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
      for (const r of list) {
        const score = r.residualScore ?? r.riskScore ?? 0;
        const rating = getRiskRating(score);
        byRating[rating]++;
      }
      return {
        data: {
          total: list.length,
          byRating,
          averageScore: list.length
            ? list.reduce((s, r) => s + (r.riskScore ?? 0), 0) / list.length
            : 0
        },
        meta: {}
      };
    })
});
