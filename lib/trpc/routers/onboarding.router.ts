/**
 * Onboarding wizard tRPC router.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { prisma } from "@/lib/prisma";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { ONBOARDING_STEPS, QUICK_MATURITY_QUESTION_IDS } from "@/lib/onboarding/steps";
import { getOnboardingRedirect } from "@/lib/onboarding/gate";
import { scoreAssessment, getMaturityLevel } from "@/lib/maturity/scoring";
import type { AnswerInput } from "@/lib/maturity/scoring";
import { MATURITY_QUESTIONS } from "@/lib/maturity/questions";

const operatingModelSchema = z.enum(["IAAS", "PAAS", "AGENT_PAAS", "SAAS", "MIXED"]);
const orgSizeSchema = z.enum(["SMALL", "MEDIUM", "LARGE", "ENTERPRISE"]);
const assetTypeSchema = z.enum(["MODEL", "PROMPT", "AGENT", "DATASET", "APPLICATION", "TOOL", "PIPELINE"]);
const euRiskSchema = z.enum(["MINIMAL", "LIMITED", "HIGH", "UNACCEPTABLE"]);
const autonomySchema = z.enum(["HUMAN_ONLY", "ASSISTED", "SEMI_AUTONOMOUS", "AUTONOMOUS"]);
const verticalKeySchema = z.string(); // VerticalKey from VERTICAL_REGULATIONS

const answerSchema = z.object({
  questionId: z.string(),
  answer: z.number(),
  score: z.number().min(1).max(5)
});

export const onboardingRouter = createTRPCRouter({
  getOnboardingState: protectedProcedure.query(async ({ ctx }) => {
    const org = await prisma.organization.findUnique({
      where: { id: ctx.orgId },
      select: {
        onboardingComplete: true,
        onboardingStep: true,
        name: true,
        orgSize: true,
        primaryUseCase: true,
        clientVerticals: true,
        operatingModel: true,
        maturityLevel: true
      }
    });
    if (!org) throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found" });

    const currentStep = org.onboardingStep >= 6 ? 6 : org.onboardingStep + 1;
    const stepDef = currentStep <= 5 ? ONBOARDING_STEPS.find((s) => s.id === currentStep) ?? null : null;

    return {
      data: {
        currentStep,
        onboardingComplete: org.onboardingComplete,
        completedData: {
          name: org.name,
          orgSize: org.orgSize,
          primaryUseCase: org.primaryUseCase,
          clientVerticals: (org.clientVerticals as string[] | null) ?? [],
          operatingModel: org.operatingModel
        },
        stepDef: stepDef ?? null,
        redirectUrl: getOnboardingRedirect(currentStep)
      },
      meta: {}
    };
  }),

  saveStep: protectedProcedure
    .input(
      z.discriminatedUnion("stepId", [
        z.object({
          stepId: z.literal(1),
          name: z.string().min(1),
          orgSize: orgSizeSchema,
          primaryUseCase: z.string().min(1)
        }),
        z.object({
          stepId: z.literal(2),
          clientVerticals: z.array(verticalKeySchema).min(1)
        }),
        z.object({
          stepId: z.literal(3),
          operatingModel: operatingModelSchema
        }),
        z.object({
          stepId: z.literal(4),
          assetName: z.string().min(1),
          assetType: assetTypeSchema,
          euRiskLevel: euRiskSchema,
          autonomyLevel: autonomySchema
        }),
        z.object({
          stepId: z.literal(5),
          answers: z.array(answerSchema).length(5)
        })
      ])
    )
    .mutation(async ({ ctx, input }) => {
      const org = await prisma.organization.findUnique({
        where: { id: ctx.orgId },
        select: { onboardingStep: true }
      });
      if (!org) throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found" });

      if (org.onboardingStep !== input.stepId - 1) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Expected step ${input.stepId}, but current step is ${org.onboardingStep + 1}`
        });
      }

      const nextStep = input.stepId + 1;

      if (input.stepId === 1) {
        await prisma.organization.update({
          where: { id: ctx.orgId },
          data: {
            name: input.name,
            orgSize: input.orgSize,
            primaryUseCase: input.primaryUseCase,
            onboardingStep: nextStep
          }
        });
      } else if (input.stepId === 2) {
        await prisma.organization.update({
          where: { id: ctx.orgId },
          data: {
            clientVerticals: input.clientVerticals as object,
            onboardingStep: nextStep
          }
        });
      } else if (input.stepId === 3) {
        await prisma.organization.update({
          where: { id: ctx.orgId },
          data: {
            operatingModel: input.operatingModel,
            onboardingStep: nextStep
          }
        });
      } else if (input.stepId === 4) {
        await prisma.$transaction(async (tx) => {
          await tx.aIAsset.create({
            data: {
              orgId: ctx.orgId,
              name: input.assetName,
              description: "First AI asset from onboarding",
              assetType: input.assetType,
              euRiskLevel: input.euRiskLevel,
              autonomyLevel: input.autonomyLevel,
              status: "DRAFT"
            }
          });
          await tx.organization.update({
            where: { id: ctx.orgId },
            data: { onboardingStep: nextStep }
          });
        });
      } else if (input.stepId === 5) {
        const answers: AnswerInput[] = input.answers.map((a) => ({
          questionId: a.questionId,
          answer: a.answer,
          score: a.score
        }));
        const validIds = new Set(QUICK_MATURITY_QUESTION_IDS);
        const filtered = answers.filter((a) => validIds.has(a.questionId as (typeof QUICK_MATURITY_QUESTION_IDS)[number]));
        if (filtered.length !== 5) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Quick maturity check requires exactly 5 answers (L1-1, L2-1, L3-1, L4-1, L5-1)"
          });
        }
        const scores = scoreAssessment(filtered);
        const maturityLevel = getMaturityLevel(scores.overall);

        await prisma.$transaction(async (tx) => {
          await tx.maturityAssessment.create({
            data: {
              orgId: ctx.orgId,
              assessedBy: ctx.userId,
              scores: scores as object,
              answers: filtered as object,
              maturityLevel,
              notes: "Quick maturity check from onboarding"
            }
          });
          await tx.organization.update({
            where: { id: ctx.orgId },
            data: { onboardingStep: 6, maturityLevel, onboardingComplete: true }
          });
        });
      }

      const redirectUrl = getOnboardingRedirect(nextStep);
      return {
        data: { nextStep, redirectUrl },
        meta: {}
      };
    }),

  completeOnboarding: protectedProcedure.mutation(async ({ ctx }) => {
    const org = await prisma.organization.findUnique({
      where: { id: ctx.orgId },
      select: { onboardingStep: true, maturityLevel: true }
    });
    if (!org) throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found" });

    await prisma.organization.update({
      where: { id: ctx.orgId },
      data: { onboardingComplete: true }
    });

    return {
      data: {
        redirectUrl: "/dashboard",
        maturityLevel: org.maturityLevel
      },
      meta: {}
    };
  }),

  resetOnboarding: protectedProcedure.mutation(async ({ ctx }) => {
    await prisma.organization.update({
      where: { id: ctx.orgId },
      data: {
        onboardingComplete: false,
        onboardingStep: 0
      }
    });
    return { data: { redirectUrl: "/onboarding" }, meta: {} };
  }),

  skipOnboarding: protectedProcedure.mutation(async ({ ctx }) => {
    await prisma.organization.update({
      where: { id: ctx.orgId },
      data: {
        onboardingComplete: true,
        onboardingStep: 6
      }
    });

    return {
      data: { redirectUrl: "/dashboard" },
      meta: {}
    };
  }),

  getQuickMaturityQuestions: protectedProcedure.query(() => {
    const questions = QUICK_MATURITY_QUESTION_IDS.map((id) =>
      MATURITY_QUESTIONS.find((q) => q.id === id)
    ).filter(Boolean);
    return { data: questions, meta: {} };
  }),

  // Legacy procedures – kept for backward compatibility with existing onboarding UI
  getSuggestedFrameworks: protectedProcedure
    .input(z.object({ verticalMarket: z.string() }))
    .query(({ input }) => {
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
      const codes = VERTICAL_FRAMEWORKS[input.verticalMarket] ?? VERTICAL_FRAMEWORKS.GENERAL;
      return { data: codes, meta: {} };
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

  activateFrameworks: protectedProcedure
    .input(z.object({ frameworkCodes: z.array(z.string()) }))
    .mutation(async ({ ctx }) => {
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
    }),

  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const org = await prisma.organization.findUnique({
      where: { id: ctx.orgId },
      include: { _count: { select: { complianceFrameworks: true } } }
    });
    const needsOnboarding = !org || !org.onboardingComplete;
    return {
      data: {
        needsOnboarding,
        orgName: org?.name,
        frameworkCount: org?._count.complianceFrameworks ?? 0
      },
      meta: {}
    };
  })
});
