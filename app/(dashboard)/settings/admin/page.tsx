import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { prisma } from "@/lib/prisma";
import { AdminContent } from "./AdminContent";

export default async function AdminPage() {
  const session = await auth();
  const user = session?.user as { role?: string; orgId?: string } | undefined;
  if (user?.role !== "ADMIN") {
    redirect("/");
  }
  const orgId = user?.orgId;
  const [org, notificationStatus, orgNotifications] = await Promise.all([
    orgId
      ? prisma.organization.findUnique({
          where: { id: orgId },
          select: { tier: true }
        })
      : null,
    (async () => {
      try {
        const caller = await createServerCaller();
        return caller.notifications.listOrgNotificationStatus();
      } catch {
        return [];
      }
    })(),
    (async () => {
      try {
        const caller = await createServerCaller();
        return caller.notifications.getOrgNotificationsEnabled();
      } catch {
        return { notificationsEnabled: true };
      }
    })()
  ]);
  const currentTier = (org?.tier ?? "FREE") as string;
  return (
    <AdminContent
      currentTier={currentTier}
      notificationStatus={notificationStatus}
      orgNotificationsEnabled={orgNotifications.notificationsEnabled}
    />
  );
}
