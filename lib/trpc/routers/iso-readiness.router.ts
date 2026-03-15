import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createTRPCRouter, protectedProcedure } from "../trpc";

const CLAUSE_IDS = [
  "4.1", "4.2", "4.3", "4.4",
  "5.1", "5.2", "5.3",
  "6.1", "6.2",
  "7.1", "7.2", "7.3", "7.4", "7.5",
  "8.1", "8.2", "8.3", "8.4",
  "9.1", "9.2", "9.3",
  "10.1", "10.2",
  "A.2", "A.3", "A.4", "A.5", "A.6", "A.7", "A.8", "A.9", "A.10"
] as const;

export const isoReadinessRouter = createTRPCRouter({
  getReadiness: protectedProcedure.query(async ({ ctx }) => {
    const records = await prisma.iSOReadiness.findMany({
      where: { orgId: ctx.orgId }
    });
    const byClause = new Map(records.map((r) => [r.clauseId, r]));
    const clauses = CLAUSE_IDS.map((id) => {
      const r = byClause.get(id);
      return {
        clauseId: id,
        status: r?.status ?? "NOT_STARTED",
        notes: r?.notes ?? null,
        completedAt: r?.completedAt ?? null,
        completedBy: r?.completedBy ?? null
      };
    });
    const complete = clauses.filter((c) => c.status === "COMPLETE").length;
    const score = Math.round((complete / clauses.length) * 100);
    return { data: { clauses, score }, meta: {} };
  }),

  updateClauseStatus: protectedProcedure
    .input(
      z.object({
        clauseId: z.string(),
        status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETE"]),
        notes: z.string().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const data: {
        status: string;
        notes?: string | null;
        completedAt?: Date | null;
        completedBy?: string | null;
      } = {
        status: input.status,
        notes: input.notes ?? null
      };
      if (input.status === "COMPLETE") {
        data.completedAt = new Date();
        data.completedBy = ctx.userId;
      } else {
        data.completedAt = null;
        data.completedBy = null;
      }
      const record = await prisma.iSOReadiness.upsert({
        where: {
          orgId_clauseId: { orgId: ctx.orgId, clauseId: input.clauseId }
        },
        create: {
          orgId: ctx.orgId,
          clauseId: input.clauseId,
          ...data
        },
        update: data
      });
      return { data: record, meta: {} };
    })
});
