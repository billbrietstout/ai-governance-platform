import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const email = req.nextUrl.searchParams.get("email"); // legacy fallback

  // Token-based unsubscribe (secure)
  if (token) {
    const user = await prisma.user.findUnique({
      where: { unsubscribeToken: token },
      select: { id: true, email: true, unsubscribedAt: true }
    });

    if (!user) {
      return NextResponse.redirect(new URL("/unsubscribe?error=invalid_token", req.nextUrl.origin));
    }

    if (!user.unsubscribedAt) {
      await prisma.$transaction([
        prisma.notificationPreference.updateMany({
          where: { userId: user.id },
          data: { emailEnabled: false }
        }),
        prisma.user.update({
          where: { id: user.id },
          data: { unsubscribedAt: new Date() }
        })
      ]);
    }

    return NextResponse.redirect(
      new URL(
        `/unsubscribe?unsubscribed=true&email=${encodeURIComponent(user.email)}&token=${token}`,
        req.nextUrl.origin
      )
    );
  }

  // Legacy email-based fallback — generate token and redirect to secure flow
  if (email) {
    const user = await prisma.user.findFirst({
      where: { email },
      select: { id: true, unsubscribeToken: true }
    });

    if (user) {
      // Generate token if missing
      let token = user.unsubscribeToken;
      if (!token) {
        token = crypto.randomBytes(32).toString("hex");
        await prisma.user.update({
          where: { id: user.id },
          data: { unsubscribeToken: token }
        });
      }
      // Redirect to token-based flow
      return NextResponse.redirect(
        new URL(`/api/v1/notifications/unsubscribe?token=${token}`, req.nextUrl.origin)
      );
    }
  }

  return NextResponse.redirect(new URL("/", req.nextUrl.origin));
}

export async function POST(req: NextRequest) {
  // Re-subscribe via token
  const { token } = await req.json();

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { unsubscribeToken: token },
    select: { id: true, email: true }
  });

  if (!user) {
    return NextResponse.json({ error: "Invalid token" }, { status: 404 });
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

  return NextResponse.json({ success: true, email: user.email });
}
