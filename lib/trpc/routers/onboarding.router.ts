import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { prisma } from "@/lib/prisma";
import { createTRPCRouter, protectedProcedure } from "../trpc";

const VERTICAL_FRAMEWORKS: Record<string, string[]> = {
  GENERAL: ["NIST_AI_RMF", "EU_AI_ACT", "COSAI_SRF"],
  HEALTHCARE: ["NIST_AI_RMF", "EU_AI_ACT", "COSAI_SRF"],
  FINANCIAL: ["NIST_AI_RMF", "EU_AI_ACT", "NIST_CSF"],
  INSURANCE: ["NIST_AI_RMF", "EU_AI_ACT", "NIST_CSF"],
  ENERGY: ["NIST_AI_RMF", "EU_AI_ACT", "NIST_CSF"],
  AUTOMOTIVE: ["NIST_AI_RMF", "EU_AI_ACT"],
  RETAIL: ["NIST_AI_RMF", "EU_AI_ACT"],
  MANUFACTURING: ["NIST_AI_RMF", "COSAI_SRF"],
  PUBLIC_SECTOR: ["NIST_AI_RMF", "EU_AI_ACT", "NIST_CSF"]
};

export const onboardingRouter = createTRPCRouter({
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const org = await prisma.organization.findUnique({
      where: { id: ctx.orgId },
      include: { _count: { select: { complianceFrameworks: true } } }
    });
    const needsOnboarding = !org || org._count.complianceFrameworks === 0;
    return {
      data: {
        needsOnboarding,
        orgName: org?.name,
        frameworkCount: org?._count.complianceFrameworks ?? 0
      },
      meta: {}
    };
  }),

  updateOrgProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        verticalMarket: z.enum(["GENERAL", "HEALTHCARE", "FINANCIAL", "INSURANCE", "AUTOMOTIVE", "RETAIL", "MANUFACTURING", "PUBLIC_SECTOR", "ENERGY"]),
        plan: z.enum(["FREE", "TEAM", "ENTERPRISE"])
      })
    )
    .mutation(async ({ ctx, input }) => {
      const org = await prisma.organization.findUnique({ where: { id: ctx.orgId } });
      if (!org) throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found" });

      const baseSlug = input.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      const slug = baseSlug ? `${baseSlug}-${ctx.orgId.slice(0, 8)}` : org.slug;
      await prisma.organization.update({
        where: { id: ctx.orgId },
        data: {
          name: input.name,
          verticalMarket: input.verticalMarket,
          plan: input.plan,
          slug
        }
      });
      return { data: { ok: true }, meta: {} };
    }),

  getSuggestedFrameworks: protectedProcedure
    .input(z.object({ verticalMarket: z.string() }))
    .query(({ input }) => {
      const codes = VERTICAL_FRAMEWORKS[input.verticalMarket] ?? VERTICAL_FRAMEWORKS.GENERAL;
      return { data: codes, meta: {} };
    }),

  activateFrameworks: protectedProcedure
    .input(z.object({ frameworkCodes: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      const { seedFrameworks } = await import("@/prisma/seed/frameworks");
      await seedFrameworks(prisma, ctx.orgId);
      return { data: { ok: true }, meta: {} };
    }),

  inviteTeam: protectedProcedure
    .input(
      z.object({
        invites: z.array(
          z.object({
            email: z.string().email(),
            role: z.enum(["ADMIN", "CAIO", "ANALYST", "MEMBER", "VIEWER", "AUDITOR"])
          })
        )
      })
    )
    .mutation(async ({ ctx, input }) => {
      for (const inv of input.invites) {
        await prisma.user.upsert({
          where: { orgId_email: { orgId: ctx.orgId, email: inv.email } },
          create: {
            orgId: ctx.orgId,
            email: inv.email,
            role: inv.role
          },
          update: { role: inv.role }
        });
      }
      return { data: { ok: true }, meta: {} };
    })
});
