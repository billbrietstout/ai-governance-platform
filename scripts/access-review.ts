/**
 * Access review – scheduled job every 90 days.
 * Flags ADMIN/CAIO roles for review. Run via cron.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const REVIEW_INTERVAL_DAYS = 90;

export async function scheduleAccessReviews(): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - REVIEW_INTERVAL_DAYS);

  const adminCaioUsers = await prisma.user.findMany({
    where: {
      role: { in: ["ADMIN", "CAIO"] },
      updatedAt: { lte: cutoff }
    },
    select: { id: true, orgId: true, role: true }
  });

  const reviewDueAt = new Date();
  reviewDueAt.setDate(reviewDueAt.getDate() + 30);

  let created = 0;
  for (const u of adminCaioUsers) {
    const existing = await prisma.accessReview.findFirst({
      where: { userId: u.id, status: "PENDING" }
    });
    if (!existing) {
      await prisma.accessReview.create({
        data: {
          orgId: u.orgId,
          userId: u.id,
          role: u.role,
          reviewDueAt,
          status: "PENDING"
        }
      });
      created++;
    }
  }
  return created;
}
