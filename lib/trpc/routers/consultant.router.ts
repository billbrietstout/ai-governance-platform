/**
 * Consultant workspace router – multi-tenant client workspaces for CONSULTANT tier.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { prisma } from "@/lib/prisma";
import { createTRPCRouter, protectedProcedure } from "../trpc";

const ASSESSMENT_SCOPE = ["FULL", "QUICK", "CUSTOM"] as const;

const VERTICAL_MARKETS = [
  "GENERAL",
  "HEALTHCARE",
  "FINANCIAL",
  "INSURANCE",
  "AUTOMOTIVE",
  "RETAIL",
  "MANUFACTURING",
  "PUBLIC_SECTOR",
  "ENERGY"
] as const;

function toVerticalMarket(v?: string): "GENERAL" | "HEALTHCARE" | "FINANCIAL" | "INSURANCE" | "AUTOMOTIVE" | "RETAIL" | "MANUFACTURING" | "PUBLIC_SECTOR" | "ENERGY" {
  if (v && VERTICAL_MARKETS.includes(v as (typeof VERTICAL_MARKETS)[number])) {
    return v as (typeof VERTICAL_MARKETS)[number];
  }
  return "GENERAL";
}

export const consultantRouter = createTRPCRouter({
  getWorkspaces: protectedProcedure.query(async ({ ctx }) => {
    const user = await prisma.user.findUnique({
      where: { id: ctx.userId },
      select: { orgId: true }
    });
    const consultantOrgId = user?.orgId ?? ctx.orgId;
    const org = await prisma.organization.findUnique({
      where: { id: consultantOrgId },
      select: { tier: true }
    });
    if (org?.tier !== "CONSULTANT") {
      return [];
    }
    const workspaces = await prisma.consultantWorkspace.findMany({
      where: { consultantOrgId, status: "ACTIVE" },
      include: {
        clientOrg: {
          select: {
            id: true,
            name: true,
            maturityLevel: true,
            updatedAt: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    const summaries = await Promise.all(
      workspaces.map(async (w) => {
        const snapshot = await prisma.complianceSnapshot.findFirst({
          where: { orgId: w.clientOrgId },
          orderBy: { createdAt: "desc" },
          select: { overallScore: true }
        });
        return {
          id: w.id,
          clientOrgId: w.clientOrgId,
          clientName: w.clientName,
          maturityLevel: w.clientOrg.maturityLevel,
          lastActivity: w.clientOrg.updatedAt,
          complianceScore: snapshot?.overallScore ?? null,
          createdAt: w.createdAt
        };
      })
    );
    return summaries;
  }),

  createWorkspace: protectedProcedure
    .input(
      z.object({
        clientName: z.string().min(1).max(200),
        clientIndustryVertical: z.string().optional(),
        primaryContactEmail: z.string().email().optional().or(z.literal("")),
        assessmentScope: z.enum(ASSESSMENT_SCOPE).default("FULL")
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await prisma.user.findUnique({
        where: { id: ctx.userId },
        select: { orgId: true }
      });
      const consultantOrgId = user?.orgId ?? ctx.orgId;
      const consultantOrg = await prisma.organization.findUnique({
        where: { id: consultantOrgId },
        select: { tier: true }
      });
      if (consultantOrg?.tier !== "CONSULTANT") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Consultant tier required" });
      }

      const baseSlug = input.clientName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const existing = await prisma.organization.count({
        where: { slug: { startsWith: baseSlug } }
      });
      const slug = existing > 0 ? `${baseSlug}-${existing + 1}` : baseSlug;

      const clientOrg = await prisma.organization.create({
        data: {
          name: input.clientName,
          slug,
          tier: "FREE",
          assetLimit: 10,
          usersLimit: 3,
          verticalMarket: toVerticalMarket(input.clientIndustryVertical)
        }
      });

      const workspace = await prisma.consultantWorkspace.create({
        data: {
          consultantOrgId,
          clientOrgId: clientOrg.id,
          clientName: input.clientName
        }
      });

      return { workspaceId: workspace.id, clientOrgId: clientOrg.id };
    }),

  switchWorkspace: protectedProcedure
    .input(z.object({ targetOrgId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const consultantOrg = await prisma.organization.findUnique({
        where: { id: ctx.orgId },
        select: { tier: true }
      });
      if (consultantOrg?.tier !== "CONSULTANT") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Consultant tier required" });
      }

      const user = await prisma.user.findUnique({
        where: { id: ctx.userId },
        select: { orgId: true }
      });
      const consultantOrgId = user?.orgId ?? ctx.orgId;

      if (input.targetOrgId === consultantOrgId) {
        return { orgId: consultantOrgId };
      }

      const link = await prisma.consultantWorkspace.findFirst({
        where: {
          consultantOrgId,
          clientOrgId: input.targetOrgId,
          status: "ACTIVE"
        }
      });
      if (!link) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Workspace access denied" });
      }

      return { orgId: input.targetOrgId };
    }),

  getWorkspaceSummary: protectedProcedure
    .input(z.object({ clientOrgId: z.string() }))
    .query(async ({ ctx, input }) => {
      const consultantOrg = await prisma.organization.findUnique({
        where: { id: ctx.orgId },
        select: { tier: true }
      });
      if (consultantOrg?.tier !== "CONSULTANT") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Consultant tier required" });
      }

      const user = await prisma.user.findUnique({
        where: { id: ctx.userId },
        select: { orgId: true }
      });
      const consultantOrgId = user?.orgId ?? ctx.orgId;

      const link = await prisma.consultantWorkspace.findFirst({
        where: {
          consultantOrgId,
          clientOrgId: input.clientOrgId,
          status: "ACTIVE"
        },
        include: { clientOrg: true }
      });
      if (!link) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Workspace not found" });
      }

      const [maturity, complianceSnapshot, assetCount] = await Promise.all([
        prisma.maturityAssessment.findFirst({
          where: { orgId: input.clientOrgId },
          orderBy: { createdAt: "desc" },
          select: { maturityLevel: true, scores: true }
        }),
        prisma.complianceSnapshot.findFirst({
          where: { orgId: input.clientOrgId },
          orderBy: { createdAt: "desc" },
          select: { overallScore: true }
        }),
        prisma.aIAsset.count({ where: { orgId: input.clientOrgId, deletedAt: null } })
      ]);

      return {
        clientName: link.clientName,
        maturityLevel: maturity?.maturityLevel ?? link.clientOrg.maturityLevel ?? 1,
        complianceScore: complianceSnapshot?.overallScore ?? null,
        lastActivity: link.clientOrg.updatedAt,
        assetCount
      };
    })
});
