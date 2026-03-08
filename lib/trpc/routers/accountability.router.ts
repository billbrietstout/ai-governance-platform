import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import type { AuditTransactionClient } from "@/lib/audit";
import { createTRPCRouter, protectedProcedure } from "../trpc";

const COSAI_LAYERS = [
  "LAYER_1_BUSINESS",
  "LAYER_2_INFORMATION",
  "LAYER_3_APPLICATION",
  "LAYER_4_PLATFORM",
  "LAYER_5_SUPPLY_CHAIN"
] as const;

export const accountabilityRouter = createTRPCRouter({
  getAccountabilityMatrix: protectedProcedure
    .input(z.object({ assetId: z.string() }))
    .query(async ({ ctx, input }) => {
      const asset = await prisma.aIAsset.findFirst({ where: { id: input.assetId, orgId: ctx.orgId, deletedAt: null } });
      if (!asset) throw new TRPCError({ code: "NOT_FOUND", message: "Asset not found" });

      const assignments = await prisma.accountabilityAssignment.findMany({
        where: { assetId: input.assetId },
        orderBy: [{ cosaiLayer: "asc" }, { componentName: "asc" }]
      });

      const byLayer: Record<string, typeof assignments> = {};
      for (const layer of COSAI_LAYERS) {
        byLayer[layer] = assignments.filter((a) => a.cosaiLayer === layer);
      }
      return { data: { assignments, byLayer }, meta: {} };
    }),

  upsertAccountabilityAssignment: protectedProcedure
    .input(
      z.object({
        assetId: z.string(),
        componentName: z.string(),
        cosaiLayer: z.enum(COSAI_LAYERS),
        accountableParty: z.string(),
        responsibleParty: z.string(),
        supportingParties: z.array(z.string()).optional(),
        notes: z.string().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const asset = await prisma.aIAsset.findFirst({ where: { id: input.assetId, orgId: ctx.orgId, deletedAt: null } });
      if (!asset) throw new TRPCError({ code: "NOT_FOUND", message: "Asset not found" });

      const prev = await prisma.accountabilityAssignment.findUnique({
        where: {
          assetId_componentName_cosaiLayer: {
            assetId: input.assetId,
            componentName: input.componentName,
            cosaiLayer: input.cosaiLayer
          }
        }
      });

      try {
        const result = await prisma.$transaction(async (tx) => {
          const att = await tx.accountabilityAssignment.upsert({
            where: {
              assetId_componentName_cosaiLayer: {
                assetId: input.assetId,
                componentName: input.componentName,
                cosaiLayer: input.cosaiLayer
              }
            },
            create: {
              assetId: input.assetId,
              componentName: input.componentName,
              cosaiLayer: input.cosaiLayer,
              accountableParty: input.accountableParty,
              responsibleParty: input.responsibleParty,
              supportingParties: input.supportingParties ?? undefined,
              notes: input.notes
            },
            update: {
              accountableParty: input.accountableParty,
              responsibleParty: input.responsibleParty,
              supportingParties: input.supportingParties ?? undefined,
              notes: input.notes
            }
          });
          await writeAuditLog({
            action: prev ? "UPDATE" : "CREATE",
            resourceType: "AccountabilityAssignment",
            resourceId: att.id,
            prevState: prev ? { accountableParty: prev.accountableParty } : undefined,
            nextState: { accountableParty: input.accountableParty },
            context: { orgId: ctx.orgId, userId: ctx.userId },
            tx: tx as unknown as AuditTransactionClient
          });
          return att;
        });
        return { data: result, meta: {} };
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes("Unique constraint") || msg.includes("unique") || msg.includes("P2002")) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "One accountable party only per (asset, component, layer). Unique constraint violation."
          });
        }
        throw e;
      }
    })
});
