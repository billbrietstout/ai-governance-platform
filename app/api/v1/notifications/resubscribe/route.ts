import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  const user = await prisma.user.findFirst({
    where: { email },
    select: { id: true }
  });

  if (user) {
    await prisma.notificationPreference.updateMany({
      where: { userId: user.id },
      data: { emailEnabled: true }
    });
  }

  return NextResponse.redirect(
    new URL(`/unsubscribe?resubscribed=true&email=${encodeURIComponent(email)}`, req.nextUrl.origin)
  );
}
