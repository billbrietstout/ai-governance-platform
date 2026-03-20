import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const email = req.nextUrl.searchParams.get("email"); // legacy fallback

  // Token-based resubscribe (secure)
  if (token) {
    const user = await prisma.user.findUnique({
      where: { unsubscribeToken: token },
      select: { id: true, email: true }
    });

    if (!user) {
      return NextResponse.redirect(new URL("/unsubscribe?error=invalid_token", req.nextUrl.origin));
    }

    await prisma.$transaction([
      prisma.notificationPreference.updateMany({
        where: { userId: user.id },
        data: { emailEnabled: true }
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { unsubscribedAt: null }
      })
    ]);

    return NextResponse.redirect(
      new URL(
        `/unsubscribe?resubscribed=true&email=${encodeURIComponent(user.email)}`,
        req.nextUrl.origin
      )
    );
  }

  // Legacy email-based fallback
  if (email) {
    const user = await prisma.user.findFirst({
      where: { email },
      select: { id: true }
    });

    if (user) {
      await prisma.$transaction([
        prisma.notificationPreference.updateMany({
          where: { userId: user.id },
          data: { emailEnabled: true }
        }),
        prisma.user.update({
          where: { id: user.id },
          data: { unsubscribedAt: null }
        })
      ]);
    }

    return NextResponse.redirect(
      new URL(
        `/unsubscribe?resubscribed=true&email=${encodeURIComponent(email)}`,
        req.nextUrl.origin
      )
    );
  }

  return NextResponse.redirect(new URL("/", req.nextUrl.origin));
}
