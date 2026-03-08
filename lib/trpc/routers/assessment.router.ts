import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import type { AuditTransactionClient } from "@/lib/audit";
import { createTRPCRouter, protectedProcedure } from "../trpc";

const statusSchema = z.enum(["DRAFT", "IN_PROGRESS", "PENDING_REVIEW", "APPROVED"]);

export const assessmentRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ assetId: z.string().optional(), status: statusSchema.optional() }).optional())
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = { orgId: ctx.orgId };
      if (input?.assetId) where.assetId = input.assetId;
      if (input?.status) where.status = input.status;

      const list = await prisma.assessment.findMany({
        where,
        include: { asset: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" }
      });
      return { data: list, meta: {} };
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const a = await prisma.assessment.findFirst({
        where: { id: input.id, orgId: ctx.orgId },
        include: { asset: { select: { id: true, name: true } } }
      });
      if (!a) throw new TRPCError({ code: "NOT_FOUND", message: "Assessment not found" });
      return { data: a, meta: {} };
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        assetId: z.string(),
        frameworkIds: z.array(z.string()),
        layersInScope: z.array(z.string()),
        reviewers: z.record(z.string(), z.string()).optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const asset = await prisma.aIAsset.findFirst({
        where: { id: input.assetId, orgId: ctx.orgId, deletedAt: null }
      });
      if (!asset) throw new TRPCError({ code: "NOT_FOUND", message: "Asset not found" });

      const result = await prisma.$transaction(async (tx) => {
        const a = await tx.assessment.create({
          data: {
            orgId: ctx.orgId,
            name: input.name,
            assetId: input.assetId,
            frameworkIds: input.frameworkIds as object,
            layersInScope: input.layersInScope as object,
            reviewers: input.reviewers as object | undefined,
            status: "DRAFT"
          }
        });
        await writeAuditLog({
          action: "CREATE",
          resourceType: "Assessment",
          resourceId: a.id,
          nextState: { name: a.name },
          context: { orgId: ctx.orgId, userId: ctx.userId },
          tx: tx as unknown as AuditTransactionClient
        });
        return a;
      });
      return { data: result, meta: {} };
    }),

  updateStatus: protectedProcedure
    .input(z.object({ id: z.string(), status: statusSchema }))
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.assessment.findFirst({
        where: { id: input.id, orgId: ctx.orgId }
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Assessment not found" });

      const result = await prisma.$transaction(async (tx) => {
        const a = await tx.assessment.update({
          where: { id: input.id },
          data: { status: input.status }
        });
        await writeAuditLog({
          action: input.status === "APPROVED" ? "APPROVE" : "UPDATE",
          resourceType: "Assessment",
          resourceId: a.id,
          prevState: { status: existing.status },
          nextState: { status: a.status },
          context: { orgId: ctx.orgId, userId: ctx.userId },
          tx: tx as unknown as AuditTransactionClient
        });
        return a;
      });
      return { data: result, meta: {} };
    })
});
