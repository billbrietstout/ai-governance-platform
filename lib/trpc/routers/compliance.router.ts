import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import type { AuditTransactionClient } from "@/lib/audit";
import * as engine from "@/lib/compliance/engine";
import {
  loadActiveFrameworksWithControlCount,
  loadFrameworkMetaByIds
} from "@/lib/compliance/framework-queries";
import * as verticalCascade from "@/lib/compliance/vertical-cascade";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const complianceRouter = createTRPCRouter({
  getFrameworks: protectedProcedure.input(z.object({}).optional()).query(async ({ ctx }) => {
    const list = await loadActiveFrameworksWithControlCount(prisma, ctx.orgId);
    return { data: list, meta: {} };
  }),

  getControls: protectedProcedure
    .input(z.object({ frameworkId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const orgFwRows = await prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM "ComplianceFramework" WHERE "orgId" = ${ctx.orgId}
      `;
      const orgFwIds = orgFwRows.map((r) => r.id);
      if (orgFwIds.length === 0) {
        return { data: [], meta: {} };
      }
      if (input.frameworkId && !orgFwIds.includes(input.frameworkId)) {
        return { data: [], meta: {} };
      }
      const where = input.frameworkId
        ? { frameworkId: input.frameworkId }
        : { frameworkId: { in: orgFwIds } };
      const list = await prisma.control.findMany({
        where
      });
      const fwIds = [...new Set(list.map((c) => c.frameworkId))];
      const meta = await loadFrameworkMetaByIds(prisma, fwIds);
      const fwById = new Map(meta.map((m) => [m.id, m]));
      const data = list.map((c) => {
        const m = fwById.get(c.frameworkId);
        return {
          ...c,
          framework: { code: m?.code ?? "", name: m?.name ?? "" }
        };
      });
      return { data, meta: {} };
    }),

  getAttestation: protectedProcedure
    .input(z.object({ assetId: z.string(), controlId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const asset = await prisma.aIAsset.findFirst({
        where: { id: input.assetId, orgId: ctx.orgId, deletedAt: null }
      });
      if (!asset) throw new TRPCError({ code: "NOT_FOUND", message: "Asset not found" });
      const list = await prisma.controlAttestation.findMany({
        where: {
          assetId: input.assetId,
          ...(input.controlId ? { controlId: input.controlId } : {})
        },
        include: { control: { select: { controlId: true, title: true } } }
      });
      return { data: list, meta: {} };
    }),

  upsertAttestation: protectedProcedure
    .input(
      z.object({
        assetId: z.string(),
        controlId: z.string(),
        status: z.enum(["PENDING", "COMPLIANT", "NON_COMPLIANT", "NOT_APPLICABLE"]),
        notes: z.string().optional(),
        evidenceRef: z.string().optional(),
        nextReviewDate: z.string().datetime().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const asset = await prisma.aIAsset.findFirst({
        where: { id: input.assetId, orgId: ctx.orgId, deletedAt: null }
      });
      if (!asset) throw new TRPCError({ code: "NOT_FOUND", message: "Asset not found" });

      const prev = await prisma.controlAttestation.findFirst({
        where: { assetId: input.assetId, controlId: input.controlId }
      });

      const result = await prisma.$transaction(async (tx) => {
        const existing = await tx.controlAttestation.findFirst({
          where: { assetId: input.assetId, controlId: input.controlId }
        });
        const att = existing
          ? await tx.controlAttestation.update({
              where: { id: existing.id },
              data: {
                status: input.status,
                notes: input.notes,
                evidenceRef: input.evidenceRef,
                nextReviewDate: input.nextReviewDate ? new Date(input.nextReviewDate) : null,
                attestedBy: ctx.userId,
                attestedAt: new Date()
              }
            })
          : await tx.controlAttestation.create({
              data: {
                assetId: input.assetId,
                controlId: input.controlId,
                status: input.status,
                notes: input.notes,
                evidenceRef: input.evidenceRef,
                nextReviewDate: input.nextReviewDate ? new Date(input.nextReviewDate) : null,
                attestedBy: ctx.userId
              }
            });
        await writeAuditLog({
          action: "ATTEST",
          resourceType: "ControlAttestation",
          resourceId: att.id,
          prevState: prev ? { status: prev.status } : undefined,
          nextState: { status: input.status },
          context: { orgId: ctx.orgId, userId: ctx.userId },
          tx: tx as unknown as AuditTransactionClient
        });
        return att;
      });

      return { data: result, meta: {} };
    }),

  getComplianceScore: protectedProcedure
    .input(z.object({ assetId: z.string(), frameworkId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const asset = await prisma.aIAsset.findFirst({
        where: { id: input.assetId, orgId: ctx.orgId, deletedAt: null }
      });
      if (!asset) throw new TRPCError({ code: "NOT_FOUND", message: "Asset not found" });
      const result = await engine.calculateComplianceScore(
        prisma,
        input.assetId,
        input.frameworkId
      );
      return { data: result, meta: {} };
    }),

  getGapAnalysis: protectedProcedure
    .input(z.object({ assetId: z.string() }))
    .query(async ({ ctx, input }) => {
      const asset = await prisma.aIAsset.findFirst({
        where: { id: input.assetId, orgId: ctx.orgId, deletedAt: null }
      });
      if (!asset) throw new TRPCError({ code: "NOT_FOUND", message: "Asset not found" });
      const result = await engine.getGapAnalysis(prisma, input.assetId);
      return { data: result, meta: {} };
    }),

  getVerticalCascade: protectedProcedure
    .input(
      z.object({
        vertical: z.string(),
        cosaiLayer: z.string().nullable().optional(),
        regulation: z.string().optional(),
        fromLayer: z.string().optional(),
        toLayer: z.string().optional()
      })
    )
    .query(async ({ ctx, input }) => {
      if (input.regulation != null && input.fromLayer != null && input.toLayer != null) {
        const chain = await verticalCascade.getCascadeChain(
          prisma,
          ctx.orgId,
          input.regulation,
          input.fromLayer,
          input.toLayer
        );
        return { data: chain, meta: {} };
      }
      const controls = await verticalCascade.getVerticalControls(
        prisma,
        ctx.orgId,
        input.vertical,
        input.cosaiLayer ?? null
      );
      return { data: controls, meta: {} };
    }),

  getRegulationMap: protectedProcedure.input(z.object({})).query(async ({ ctx }) => {
    const result = await verticalCascade.getRegulationMap(prisma, ctx.orgId);
    return { data: result, meta: {} };
  }),

  getCrossFrameworkMapping: protectedProcedure
    .input(z.object({ controlId: z.string() }))
    .query(async ({ input }) => {
      const result = await engine.getCrossFrameworkMapping(prisma, input.controlId);
      return { data: result, meta: {} };
    })
});
