import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendWeeklyDigestToUser } from "@/lib/notifications/engine";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await auth();
  const user = session?.user as { id?: string; orgId?: string } | undefined;
  if (!user?.id || !user?.orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { email: true }
  });
  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await sendWeeklyDigestToUser(
    { id: user.id, email: dbUser.email },
    user.orgId
  );
  return NextResponse.json({ sent: true });
}
