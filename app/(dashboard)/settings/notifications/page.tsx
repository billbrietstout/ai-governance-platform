/**
 * Notification Preferences – email alerts, digest schedule, Slack (future).
 */
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NotificationPreferencesForm } from "./NotificationPreferencesForm";

export const dynamic = "force-dynamic";

export default async function NotificationsSettingsPage() {
  const session = await auth();
  const user = session?.user as { id?: string; orgId?: string; email?: string | null } | undefined;
  if (!user?.id || !user?.orgId) {
    redirect("/login");
  }

  let prefs = await prisma.notificationPreference.findUnique({
    where: { userId: user.id }
  });
  if (!prefs) {
    prefs = await prisma.notificationPreference.create({
      data: {
        userId: user.id,
        orgId: user.orgId,
        weeklyDigest: true,
        emailEnabled: true
      }
    });
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 px-6 py-10">
      <div>
        <Link href="/settings" className="text-sm text-navy-600 hover:underline">
          ← Settings
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
          Notification Preferences
        </h1>
        <p className="mt-1 text-gray-600">
          Manage how you receive AI posture alerts and weekly briefings.
        </p>
      </div>

      <NotificationPreferencesForm
        initialPrefs={prefs}
        userEmail={user.email ?? null}
      />
    </main>
  );
}
