import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { prisma } from "@/lib/prisma";
import { writeAuditLog, type AuditTransactionClient } from "@/lib/audit";
import { createTRPCRouter, protectedProcedure } from "../trpc";

const COSAI_LAYERS = [
  "LAYER_1_BUSINESS",
  "LAYER_2_INFORMATION",
  "LAYER_3_APPLICATION",
  "LAYER_4_PLATFORM",
  "LAYER_5_SUPPLY_CHAIN"
] as const;

export const accountabilityRouter = createTRPCRouter({
  getCrossAssetMatrix: protectedProcedure
    .input(z.object({ cosaiLayer: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const assets = await prisma.aIAsset.findMany({
        where: { orgId: ctx.orgId, deletedAt: null },
        select: { id: true, name: true }
      });

      const assignments = await prisma.accountabilityAssignment.findMany({
        where: {
          assetId: { in: assets.map((a) => a.id) },
          ...(input.cosaiLayer
            ? {
                cosaiLayer: input.cosaiLayer as
                  | "LAYER_1_BUSINESS"
                  | "LAYER_2_INFORMATION"
                  | "LAYER_3_APPLICATION"
                  | "LAYER_4_PLATFORM"
                  | "LAYER_5_SUPPLY_CHAIN"
              }
            : {})
        },
        orderBy: [{ cosaiLayer: "asc" }, { componentName: "asc" }]
      });

      const byAsset = new Map<string, typeof assignments>();
      for (const a of assignments) {
        const list = byAsset.get(a.assetId) ?? [];
        list.push(a);
        byAsset.set(a.assetId, list);
      }

      const gaps = assets.filter((a) => {
        const list = byAsset.get(a.id) ?? [];
        return list.length === 0;
      });

      return {
        data: {
          assets,
          assignments,
          byAsset: Object.fromEntries(byAsset),
          gaps: gaps.map((g) => ({ assetId: g.id, assetName: g.name }))
        },
        meta: {}
      };
    }),

  getAccountabilityMatrix: protectedProcedure
    .input(z.object({ assetId: z.string() }))
    .query(async ({ ctx, input }) => {
      const asset = await prisma.aIAsset.findFirst({
        where: { id: input.assetId, orgId: ctx.orgId, deletedAt: null }
      });
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
      const asset = await prisma.aIAsset.findFirst({
        where: { id: input.assetId, orgId: ctx.orgId, deletedAt: null }
      });
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
            message:
              "One accountable party only per (asset, component, layer). Unique constraint violation."
          });
        }
        throw e;
      }
    }),

  assignBulk: protectedProcedure
    .input(
      z.array(
        z.object({
          assetId: z.string(),
          userId: z.string(),
          suggestionRank: z.number().optional(),
          suggestionReason: z.string().optional(),
          wasAutoSuggested: z.boolean().optional()
        })
      )
    )
    .mutation(async ({ ctx, input }) => {
      const users = await prisma.user.findMany({
        where: { id: { in: [...new Set(input.map((i) => i.userId))] }, orgId: ctx.orgId },
        select: { id: true, email: true, persona: true, role: true }
      });
      const userEmailById = new Map(users.map((u) => [u.id, u.email ?? u.id]));

      const assets = await prisma.aIAsset.findMany({
        where: { id: { in: input.map((i) => i.assetId) }, orgId: ctx.orgId, deletedAt: null },
        select: { id: true, name: true, cosaiLayer: true }
      });
      const assetById = new Map(assets.map((a) => [a.id, a]));

      const COSAI_LAYERS = [
        "LAYER_1_BUSINESS",
        "LAYER_2_INFORMATION",
        "LAYER_3_APPLICATION",
        "LAYER_4_PLATFORM",
        "LAYER_5_SUPPLY_CHAIN"
      ] as const;
      const defaultLayer = "LAYER_3_APPLICATION";

      await prisma.$transaction(async (tx) => {
        for (const { assetId, userId } of input) {
          const asset = assetById.get(assetId);
          if (!asset) continue;
          const email = userEmailById.get(userId) ?? userId;
          const cosaiLayer =
            asset.cosaiLayer &&
            COSAI_LAYERS.includes(asset.cosaiLayer as (typeof COSAI_LAYERS)[number])
              ? (asset.cosaiLayer as (typeof COSAI_LAYERS)[number])
              : defaultLayer;

          await tx.accountabilityAssignment.upsert({
            where: {
              assetId_componentName_cosaiLayer: {
                assetId,
                componentName: asset.name,
                cosaiLayer
              }
            },
            create: {
              assetId,
              componentName: asset.name,
              cosaiLayer,
              accountableParty: email,
              responsibleParty: email
            },
            update: {
              accountableParty: email,
              responsibleParty: email
            }
          });
        }
        const suggestionMeta = input
          .filter((i) => i.suggestionRank != null || i.wasAutoSuggested)
          .map((i) => ({
            assetId: i.assetId,
            suggestionRank: i.suggestionRank,
            suggestionReason: i.suggestionReason,
            wasAutoSuggested: i.wasAutoSuggested
          }));
        await writeAuditLog({
          action: "UPDATE",
          resourceType: "AIAsset",
          resourceId: "bulk",
          nextState: {
            assignments: input.length,
            ...(suggestionMeta.length > 0 && { suggestionMeta })
          },
          context: { orgId: ctx.orgId, userId: ctx.userId },
          tx: tx as unknown as AuditTransactionClient
        });
      });

      return {
        data: {
          assigned: input.length,
          byUser: Object.entries(
            input.reduce<Record<string, number>>((acc, { userId }) => {
              acc[userId] = (acc[userId] ?? 0) + 1;
              return acc;
            }, {})
          ).map(([userId, count]) => {
            const u = users.find((x) => x.id === userId);
            return {
              userId,
              count,
              email: u?.email,
              persona: u?.persona,
              role: u?.role
            };
          })
        },
        meta: {}
      };
    })
});
