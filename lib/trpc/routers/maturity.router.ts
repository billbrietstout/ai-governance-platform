/**
 * Maturity assessment tRPC router.
 */
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { MATURITY_QUESTIONS } from "@/lib/maturity/questions";
import { scoreAssessment, getMaturityLevel, getNextSteps } from "@/lib/maturity/scoring";
import type { AnswerInput } from "@/lib/maturity/scoring";
import { createTRPCRouter, protectedProcedure } from "../trpc";

const answerSchema = z.object({
  questionId: z.string(),
  answer: z.number(),
  score: z.number().min(1).max(5)
});

export const maturityRouter = createTRPCRouter({
  getPreviousAssessment: protectedProcedure.query(async ({ ctx }) => {
    const assessments = await prisma.maturityAssessment.findMany({
      where: { orgId: ctx.orgId },
      orderBy: { createdAt: "desc" },
      take: 2
    });
    const prev = assessments[1];
    if (!prev) return { data: null, meta: {} };
    return {
      data: {
        id: prev.id,
        scores: prev.scores as Record<string, number>,
        maturityLevel: prev.maturityLevel,
        createdAt: prev.createdAt
      },
      meta: {}
    };
  }),

  getLatestAssessment: protectedProcedure.query(async ({ ctx }) => {
    const assessment = await prisma.maturityAssessment.findFirst({
      where: { orgId: ctx.orgId },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { email: true } } }
    });
    if (!assessment) return { data: null, meta: {} };
    return {
      data: {
        id: assessment.id,
        scores: assessment.scores as Record<string, number>,
        answers: assessment.answers as AnswerInput[],
        maturityLevel: assessment.maturityLevel,
        notes: assessment.notes,
        assessedBy: assessment.user.email,
        createdAt: assessment.createdAt
      },
      meta: {}
    };
  }),

  submitAssessment: protectedProcedure
    .input(z.object({ answers: z.array(answerSchema), notes: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const answers: AnswerInput[] = input.answers.map((a) => ({
        questionId: a.questionId,
        answer: a.answer,
        score: a.score
      }));
      const scores = scoreAssessment(answers);
      const maturityLevel = getMaturityLevel(scores.overall);

      const assessment = await prisma.$transaction(async (tx) => {
        const a = await tx.maturityAssessment.create({
          data: {
            orgId: ctx.orgId,
            assessedBy: ctx.userId,
            scores: scores as object,
            answers: answers as object,
            maturityLevel,
            notes: input.notes ?? null
          }
        });
        await tx.organization.update({
          where: { id: ctx.orgId },
          data: { maturityLevel }
        });
        return a;
      });

      return {
        data: { id: assessment.id, scores, maturityLevel, createdAt: assessment.createdAt },
        meta: {}
      };
    }),

  getQuestions: protectedProcedure
    .input(
      z
        .object({
          layer: z.enum(["L1", "L2", "L3", "L4", "L5"]).optional(),
          maxLevel: z.number().min(1).max(5).optional()
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      let questions = [...MATURITY_QUESTIONS];
      if (input?.layer) questions = questions.filter((q) => q.layer === input.layer);
      const org = await prisma.organization.findUnique({
        where: { id: ctx.orgId },
        select: { maturityLevel: true }
      });
      const currentLevel = org?.maturityLevel ?? 1;
      const maxLevel = input?.maxLevel ?? Math.min(currentLevel + 1, 5);
      questions = questions.filter((q) => q.level <= maxLevel);
      return { data: questions, meta: {} };
    }),

  getMaturityScore: protectedProcedure.query(async ({ ctx }) => {
    const [assessment, org] = await Promise.all([
      prisma.maturityAssessment.findFirst({
        where: { orgId: ctx.orgId },
        orderBy: { createdAt: "desc" }
      }),
      prisma.organization.findUnique({
        where: { id: ctx.orgId },
        select: { maturityLevel: true, verticalMarket: true }
      })
    ]);

    const scores = assessment?.scores as Record<string, number> | null;
    const maturityLevel = org?.maturityLevel ?? 1;
    const nextLevel = Math.min(maturityLevel + 1, 5);
    const progressToNext =
      scores?.overall != null && nextLevel > maturityLevel
        ? Math.min(
            100,
            Math.max(0, ((scores.overall - maturityLevel) / (nextLevel - maturityLevel)) * 100)
          )
        : maturityLevel >= 5
          ? 100
          : 0;

    const nextSteps = scores
      ? getNextSteps(
          scores as { L1: number; L2: number; L3: number; L4: number; L5: number; overall: number },
          org?.verticalMarket ?? undefined
        )
      : [];

    return {
      data: {
        scores: scores ?? { L1: 1, L2: 1, L3: 1, L4: 1, L5: 1, overall: 1 },
        maturityLevel,
        progressToNext: Math.round(progressToNext),
        nextSteps,
        lastAssessedAt: assessment?.createdAt ?? null
      },
      meta: {}
    };
  })
});
