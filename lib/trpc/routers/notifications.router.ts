/**
 * Notification preferences tRPC router.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { prisma } from "@/lib/prisma";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { sendWeeklyDigestToUser } from "@/lib/notifications/engine";

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"] as const;
const TIMES = ["06:00", "07:00", "08:00", "09:00", "10:00"] as const;

export const notificationsRouter = createTRPCRouter({
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    const orgId = ctx.consultantOrgId ?? ctx.orgId;
    let pref = await prisma.notificationPreference.findUnique({
      where: { userId: ctx.userId }
    });
    if (!pref) {
      pref = await prisma.notificationPreference.create({
        data: {
          userId: ctx.userId,
          orgId,
          weeklyDigest: true,
          emailEnabled: true
        }
      });
    }
    return pref;
  }),

  updatePreferences: protectedProcedure
    .input(
      z.object({
        weeklyDigest: z.boolean().optional(),
        weeklyDigestDay: z.enum(DAYS).optional(),
        weeklyDigestTime: z.enum(TIMES).optional(),
        complianceDropAlert: z.boolean().optional(),
        complianceDropThreshold: z.number().int().min(0).max(100).optional(),
        newCriticalRiskAlert: z.boolean().optional(),
        regulatoryDeadline90: z.boolean().optional(),
        regulatoryDeadline30: z.boolean().optional(),
        regulatoryDeadline7: z.boolean().optional(),
        vendorEvidenceExpiry: z.boolean().optional(),
        evidenceExpiryDays: z.number().int().min(1).max(365).optional(),
        shadowAiDetected: z.boolean().optional(),
        newUnownedHighRisk: z.boolean().optional(),
        failedScanAlert: z.boolean().optional(),
        emailEnabled: z.boolean().optional(),
        slackWebhookUrl: z.string().url().nullable().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.consultantOrgId ?? ctx.orgId;
      return prisma.notificationPreference.upsert({
        where: { userId: ctx.userId },
        create: {
          userId: ctx.userId,
          orgId,
          ...input
        },
        update: input
      });
    }),

  sendTestDigest: protectedProcedure.mutation(async ({ ctx }) => {
    const orgId = ctx.consultantOrgId ?? ctx.orgId;
    const user = await prisma.user.findUnique({
      where: { id: ctx.userId },
      select: { email: true }
    });
    if (user) {
      await sendWeeklyDigestToUser({ id: ctx.userId, email: user.email }, orgId);
    }
    return { sent: true };
  }),

  setUserEmailEnabled: protectedProcedure
    .input(z.object({ targetUserId: z.string(), enabled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.role !== "ADMIN") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const orgId = ctx.consultantOrgId ?? ctx.orgId;
      const targetUser = await prisma.user.findFirst({
        where: { id: input.targetUserId, orgId }
      });
      if (!targetUser) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      await prisma.notificationPreference.upsert({
        where: { userId: input.targetUserId },
        update: { emailEnabled: input.enabled },
        create: {
          userId: input.targetUserId,
          orgId,
          emailEnabled: input.enabled
        }
      });
      return { success: true };
    }),

  listOrgNotificationStatus: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.role !== "ADMIN") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    const orgId = ctx.consultantOrgId ?? ctx.orgId;
    const users = await prisma.user.findMany({
      where: { orgId },
      select: { id: true, email: true },
      orderBy: { email: "asc" }
    });
    const prefs = await prisma.notificationPreference.findMany({
      where: { userId: { in: users.map((u) => u.id) } },
      select: { userId: true, emailEnabled: true }
    });
    const prefMap = new Map(prefs.map((p) => [p.userId, p.emailEnabled]));
    const lastDigests = await prisma.notificationLog.findMany({
      where: {
        orgId,
        type: "WEEKLY_DIGEST",
        userId: { not: null }
      },
      select: { userId: true, sentAt: true },
      orderBy: { sentAt: "desc" }
    });
    const lastByUser = new Map<string, Date>();
    for (const log of lastDigests) {
      if (log.userId && !lastByUser.has(log.userId)) {
        lastByUser.set(log.userId, log.sentAt);
      }
    }
    const today = new Date();
    return users.map((u) => {
      const lastSent = lastByUser.get(u.id);
      const daysAgo = lastSent
        ? Math.floor((today.getTime() - lastSent.getTime()) / (1000 * 60 * 60 * 24))
        : null;
      return {
        userId: u.id,
        email: u.email,
        emailEnabled: prefMap.get(u.id) ?? true,
        lastDigestDaysAgo: daysAgo,
        lastDigestLabel:
          daysAgo === null ? "Never" : daysAgo === 0 ? "Today" : `${daysAgo} days ago`
      };
    });
  }),

  sendTestDigestToAll: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.role !== "ADMIN") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    const orgId = ctx.consultantOrgId ?? ctx.orgId;
    const users = await prisma.user.findMany({
      where: { orgId },
      select: { id: true, email: true }
    });
    for (const u of users) {
      try {
        await sendWeeklyDigestToUser(u, orgId);
      } catch (err) {
        console.error(`Test digest failed for ${u.email}:`, err);
      }
    }
    return { sent: users.length };
  }),

  getOrgNotificationsEnabled: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.role !== "ADMIN") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    const orgId = ctx.consultantOrgId ?? ctx.orgId;
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { notificationsEnabled: true }
    });
    return { notificationsEnabled: org?.notificationsEnabled ?? true };
  }),

  setOrgNotificationsEnabled: protectedProcedure
    .input(z.object({ enabled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.role !== "ADMIN") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const orgId = ctx.consultantOrgId ?? ctx.orgId;
      await prisma.organization.update({
        where: { id: orgId },
        data: { notificationsEnabled: input.enabled }
      });
      return { success: true };
    })
});
