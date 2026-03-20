import { z } from "zod";
import { TRPCError } from "@trpc/server";

import type { AutonomyLevel } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { runDiscovery, type DiscoveryInputs } from "@/lib/discovery/engine";
import { createTRPCRouter, protectedProcedure } from "../trpc";

function mapClientVerticalToBusinessFunction(
  cv: string | null
): "HR" | "Finance" | "Operations" | "Customer Service" | "Healthcare" | "Legal" | "Other" {
  if (!cv) return "Other";
  const u = cv.toUpperCase();
  if (u.includes("HR")) return "HR";
  if (u.includes("FINANCIAL") || u.includes("FINANCE")) return "Finance";
  if (u.includes("HEALTHCARE") || u.includes("HEALTH")) return "Healthcare";
  if (u.includes("LEGAL")) return "Legal";
  return "Operations";
}

function mapAutonomyToL(a: AutonomyLevel | null): "L0" | "L1" | "L2" | "L3" | "L4" | "L5" {
  switch (a) {
    case "HUMAN_ONLY":
      return "L0";
    case "ASSISTED":
      return "L1";
    case "SEMI_AUTONOMOUS":
      return "L3";
    case "AUTONOMOUS":
      return "L5";
    default:
      return "L2";
  }
}

const discoveryInputsSchema = z.object({
  assetType: z.enum(["MODEL", "AGENT", "APPLICATION", "PIPELINE"]),
  description: z.string().max(200).optional(),
  businessFunction: z.enum([
    "HR",
    "Finance",
    "Operations",
    "Customer Service",
    "Healthcare",
    "Legal",
    "Other"
  ]),
  decisionsAffectingPeople: z.boolean(),
  interactsWithEndUsers: z.boolean(),
  deployment: z.enum(["EU_market", "US_only", "Global", "Internal_only"]),
  verticals: z.array(z.string()),
  operatingModel: z.string().optional(),
  autonomyLevel: z.enum(["L0", "L1", "L2", "L3", "L4", "L5"]),
  dataTypes: z.array(z.string()),
  euResidentsData: z.enum(["Yes", "No", "Unknown"]),
  expectedRiskLevel: z.enum(["Low", "Medium", "High", "Critical"]),
  vulnerablePopulations: z.boolean()
});

export const discoveryRouter = createTRPCRouter({
  getOrgContext: protectedProcedure.query(async ({ ctx }) => {
    const org = await prisma.organization.findUnique({
      where: { id: ctx.orgId },
      select: { clientVerticals: true, operatingModel: true }
    });
    const clientVerticals = (org?.clientVerticals as string[] | null) ?? [];
    const operatingModel = org?.operatingModel ?? null;
    return { data: { clientVerticals, operatingModel }, meta: {} };
  }),

  getAssetsForReview: protectedProcedure.query(async ({ ctx }) => {
    if (!prisma?.aIAsset) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database client not ready. Run 'npx prisma generate' and restart the dev server."
      });
    }
    const assets = await prisma.aIAsset.findMany({
      where: { orgId: ctx.orgId, deletedAt: null },
      select: { id: true, name: true, assetType: true, description: true },
      orderBy: { name: "asc" }
    });
    return { data: assets, meta: {} };
  }),

  runDiscovery: protectedProcedure
    .input(
      z.object({
        inputs: discoveryInputsSchema,
        assetId: z.string().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const results = runDiscovery(input.inputs as DiscoveryInputs);
      const discovery = await prisma.regulationDiscovery.create({
        data: {
          orgId: ctx.orgId,
          assetId: input.assetId ?? null,
          inputs: input.inputs as object,
          results: results as object,
          createdBy: ctx.userId
        }
      });
      return { data: { id: discovery.id, results }, meta: {} };
    }),

  runDiscoveryForAsset: protectedProcedure
    .input(z.object({ assetId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const asset = await prisma.aIAsset.findFirst({
        where: { id: input.assetId, orgId: ctx.orgId, deletedAt: null }
      });
      if (!asset) throw new TRPCError({ code: "NOT_FOUND", message: "Asset not found" });

      const org = await prisma.organization.findUnique({
        where: { id: ctx.orgId },
        select: { clientVerticals: true }
      });
      const clientVerticals = (org?.clientVerticals as string[] | null) ?? [];
      const verticals = clientVerticals.length > 0 ? clientVerticals : ["GENERAL"];

      const assetTypeMap = {
        MODEL: "MODEL" as const,
        AGENT: "AGENT" as const,
        APPLICATION: "APPLICATION" as const,
        PIPELINE: "PIPELINE" as const,
        PROMPT: "MODEL" as const,
        DATASET: "APPLICATION" as const,
        TOOL: "APPLICATION" as const
      };
      const mappedType = assetTypeMap[asset.assetType] ?? "APPLICATION";

      const inputs: DiscoveryInputs = {
        assetType: mappedType,
        description: asset.description ?? undefined,
        businessFunction: mapClientVerticalToBusinessFunction(asset.clientVertical),
        decisionsAffectingPeople: true,
        interactsWithEndUsers: true,
        deployment: "Global",
        verticals,
        autonomyLevel: mapAutonomyToL(asset.autonomyLevel),
        dataTypes: ["Proprietary"],
        euResidentsData: "Unknown",
        expectedRiskLevel:
          asset.euRiskLevel === "HIGH"
            ? "High"
            : asset.euRiskLevel === "LIMITED"
              ? "Medium"
              : "Low",
        vulnerablePopulations: false
      };

      const results = runDiscovery(inputs);
      const discovery = await prisma.regulationDiscovery.create({
        data: {
          orgId: ctx.orgId,
          assetId: input.assetId,
          inputs: inputs as object,
          results: results as object,
          createdBy: ctx.userId
        }
      });
      return { data: { id: discovery.id, results, inputs }, meta: {} };
    }),

  getDiscoveries: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(10) }).optional())
    .query(async ({ ctx, input }) => {
      if (!prisma?.regulationDiscovery) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Database client not ready. Run 'npx prisma generate' and restart the dev server."
        });
      }
      const limit = input?.limit ?? 10;
      const list = await prisma.regulationDiscovery.findMany({
        where: { orgId: ctx.orgId },
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          id: true,
          assetId: true,
          inputs: true,
          results: true,
          createdAt: true,
          asset: { select: { id: true, name: true } }
        }
      });
      return { data: list, meta: {} };
    }),

  setOperatingModel: protectedProcedure
    .input(z.object({ operatingModel: z.enum(["IAAS", "PAAS", "AGENT_PAAS", "SAAS", "MIXED"]) }))
    .mutation(async ({ ctx, input }) => {
      await prisma.organization.update({
        where: { id: ctx.orgId },
        data: { operatingModel: input.operatingModel }
      });
      return { data: { ok: true }, meta: {} };
    }),

  getDiscovery: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const discovery = await prisma.regulationDiscovery.findFirst({
        where: { id: input.id, orgId: ctx.orgId },
        include: { asset: { select: { id: true, name: true } } }
      });
      if (!discovery) throw new TRPCError({ code: "NOT_FOUND", message: "Discovery not found" });
      return { data: discovery, meta: {} };
    })
});
