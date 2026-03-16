import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminContent } from "./AdminContent";

export default async function AdminPage() {
  const session = await auth();
  const user = session?.user as { role?: string; orgId?: string } | undefined;
  if (user?.role !== "ADMIN") {
    redirect("/");
  }
  const orgId = user?.orgId;
  const org = orgId
    ? await prisma.organization.findUnique({
        where: { id: orgId },
        select: { tier: true }
      })
    : null;
  const currentTier = (org?.tier ?? "FREE") as string;
  return <AdminContent currentTier={currentTier} />;
}
