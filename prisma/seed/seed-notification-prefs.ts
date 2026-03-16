/**
 * Create NotificationPreference records for existing users who don't have one.
 * Run as: npx tsx prisma/seed/seed-notification-prefs.ts
 */
import type { PrismaClient } from "@prisma/client";

export async function seedNotificationPrefs(prisma: PrismaClient) {
  const usersWithoutPrefs = await prisma.user.findMany({
    where: {
      notificationPreference: null
    },
    select: { id: true, orgId: true }
  });

  let created = 0;
  for (const u of usersWithoutPrefs) {
    await prisma.notificationPreference.create({
      data: {
        userId: u.id,
        orgId: u.orgId,
        weeklyDigest: true,
        emailEnabled: true
      }
    });
    created++;
  }
  return created;
}
