/**
 * Consultant workspace router – read+write access via explicit workspaceOrgId.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { prisma } from "@/lib/prisma";
import { createTRPCRouter, protectedProcedure } from "../trpc";

function requireConsultantTier(ctx: { consultantOrgId: string | null; orgId: string }) {
  const orgId = ctx.consultantOrgId ?? ctx.orgId;
  return async () => {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { tier: true }
    });
    if (org?.tier !== "CONSULTANT" && org?.tier !== "ENTERPRISE") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Consultant tier required"
      });
    }
  };
}

export const consultantRouter = createTRPCRouter({
  getWorkspaces: protectedProcedure.query(async ({ ctx }) => {
    const consultantOrgId = ctx.consultantOrgId ?? ctx.orgId;
    const checkTier = requireConsultantTier(ctx);
    await checkTier();

    const workspaces = await prisma.consultantWorkspace.findMany({
      where: { consultantOrgId, status: "ACTIVE" },
      include: {
        clientOrg: {
          select: {
            id: true,
            name: true,
            maturityLevel: true,
            tier: true,
            updatedAt: true
          }
        }
      },
      orderBy: { updatedAt: "desc" }
    });

    const workspacesWithScores = await Promise.all(
      workspaces.map(async (ws) => {
        const snapshot = await prisma.complianceSnapshot.findFirst({
          where: { orgId: ws.clientOrgId },
          orderBy: { createdAt: "desc" },
          select: { overallScore: true, createdAt: true }
        });
        const assetCount = await prisma.aIAsset.count({
          where: { orgId: ws.clientOrgId, deletedAt: null }
        });
        return {
          ...ws,
          complianceScore: snapshot?.overallScore ?? 0,
          lastSnapshot: snapshot?.createdAt ?? null,
          assetCount
        };
      })
    );

    return workspacesWithScores;
  }),

  createWorkspace: protectedProcedure
    .input(
      z.object({
        clientName: z.string().min(2),
        clientContact: z.string().email().optional(),
        clientVertical: z.string().optional(),
        assessmentScope: z.enum(["FULL", "QUICK", "CUSTOM"]).default("FULL")
      })
    )
    .mutation(async ({ ctx, input }) => {
      const consultantOrgId = ctx.consultantOrgId ?? ctx.orgId;
      const checkTier = requireConsultantTier(ctx);
      await checkTier();

      const existing = await prisma.consultantWorkspace.count({
        where: { consultantOrgId, status: "ACTIVE" }
      });
      if (existing >= 50) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Workspace limit reached (50)"
        });
      }

      const slug =
        input.clientName
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "") +
        "-" +
        Date.now();

      const { clientOrg, workspace } = await prisma.$transaction(async (tx) => {
        const clientOrg = await tx.organization.create({
          data: {
            name: input.clientName,
            slug,
            tier: "FREE",
            assetLimit: 10,
            usersLimit: 3,
            isClientOrg: true,
            createdByConsultantOrgId: consultantOrgId,
            onboardingComplete: false
          }
        });

        const workspace = await tx.consultantWorkspace.create({
          data: {
            consultantOrgId,
            clientOrgId: clientOrg.id,
            clientName: input.clientName,
            clientContact: input.clientContact ?? null,
            clientVertical: input.clientVertical ?? null,
            assessmentScope: input.assessmentScope
          }
        });

        await tx.auditLog.create({
          data: {
            orgId: consultantOrgId,
            userId: ctx.userId,
            action: "CREATE",
            resourceType: "ConsultantWorkspace",
            resourceId: workspace.id,
            nextState: {
              clientName: input.clientName,
              clientOrgId: clientOrg.id,
              ...(ctx.isConsultantAccess && {
                consultantAccess: true,
                consultantOrgId: ctx.consultantOrgId,
                onBehalfOf: ctx.orgId
              })
            }
          }
        });

        return { clientOrg, workspace };
      });

      return { workspace, clientOrg };
    }),

  deleteWorkspace: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const consultantOrgId = ctx.consultantOrgId ?? ctx.orgId;
      const checkTier = requireConsultantTier(ctx);
      await checkTier();

      const result = await prisma.consultantWorkspace.updateMany({
        where: { id: input.workspaceId, consultantOrgId },
        data: { status: "ARCHIVED" }
      });
      return { success: result.count > 0 };
    }),

  getWorkspaceSummary: protectedProcedure
    .input(z.object({ clientOrgId: z.string() }))
    .query(async ({ ctx, input }) => {
      const consultantOrgId = ctx.consultantOrgId ?? ctx.orgId;
      const checkTier = requireConsultantTier(ctx);
      await checkTier();

      const workspace = await prisma.consultantWorkspace.findFirst({
        where: {
          consultantOrgId,
          clientOrgId: input.clientOrgId,
          status: "ACTIVE"
        }
      });
      if (!workspace) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Workspace not found" });
      }

      const [org, assets, snapshot, discoveries] = await Promise.all([
        prisma.organization.findUnique({
          where: { id: input.clientOrgId },
          select: { name: true, maturityLevel: true, tier: true }
        }),
        prisma.aIAsset.count({
          where: { orgId: input.clientOrgId, deletedAt: null }
        }),
        prisma.complianceSnapshot.findFirst({
          where: { orgId: input.clientOrgId },
          orderBy: { createdAt: "desc" }
        }),
        prisma.regulationDiscovery.count({
          where: { orgId: input.clientOrgId }
        })
      ]);

      return { org, assets, snapshot, discoveries, workspace };
    })
});
