/**
 * Organization tier and limits tRPC router.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { prisma } from "@/lib/prisma";
import { createTRPCRouter, protectedProcedure } from "../trpc";

const TIER_LIMITS: Record<string, { assetLimit: number; usersLimit: number }> = {
  FREE: { assetLimit: 10, usersLimit: 3 },
  PRO: { assetLimit: 500, usersLimit: 25 },
  CONSULTANT: { assetLimit: 500, usersLimit: 25 },
  ENTERPRISE: { assetLimit: 0, usersLimit: 0 }
};

export const orgRouter = createTRPCRouter({
  getTier: protectedProcedure.query(async ({ ctx }) => {
    const org = await prisma.organization.findUnique({
      where: { id: ctx.orgId },
      select: {
        tier: true,
        assetLimit: true,
        usersLimit: true,
        trialEndsAt: true
      }
    });
    return org;
  }),

  setOrgTier: protectedProcedure
    .input(z.object({ tier: z.enum(["FREE", "PRO", "CONSULTANT", "ENTERPRISE"]) }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.role !== "ADMIN") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const limits = TIER_LIMITS[input.tier];
      return prisma.organization.update({
        where: { id: ctx.orgId },
        data: { tier: input.tier, assetLimit: limits.assetLimit, usersLimit: limits.usersLimit }
      });
    })
});
