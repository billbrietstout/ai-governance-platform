/**
 * Organization tier and limits tRPC router.
 */
import { prisma } from "@/lib/prisma";
import { createTRPCRouter, protectedProcedure } from "../trpc";

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
  })
});
