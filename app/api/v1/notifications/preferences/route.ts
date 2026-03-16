import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  const user = session?.user as { id?: string; orgId?: string } | undefined;
  if (!user?.id || !user?.orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let pref = await prisma.notificationPreference.findUnique({
    where: { userId: user.id }
  });
  if (!pref) {
    pref = await prisma.notificationPreference.create({
      data: {
        userId: user.id,
        orgId: user.orgId,
        weeklyDigest: true,
        emailEnabled: true
      }
    });
  }
  return NextResponse.json(pref);
}

const PREF_KEYS = [
  "weeklyDigest",
  "weeklyDigestDay",
  "weeklyDigestTime",
  "complianceDropAlert",
  "complianceDropThreshold",
  "newCriticalRiskAlert",
  "regulatoryDeadline90",
  "regulatoryDeadline30",
  "regulatoryDeadline7",
  "vendorEvidenceExpiry",
  "evidenceExpiryDays",
  "shadowAiDetected",
  "newUnownedHighRisk",
  "failedScanAlert",
  "emailEnabled",
  "slackWebhookUrl"
] as const;

export async function PATCH(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { id?: string; orgId?: string } | undefined;
  if (!user?.id || !user?.orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as Record<string, unknown>;
  const data: Record<string, unknown> = {};
  for (const k of PREF_KEYS) {
    if (body[k] !== undefined) data[k] = body[k];
  }

  const pref = await prisma.notificationPreference.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      orgId: user.orgId,
      ...data
    } as Parameters<typeof prisma.notificationPreference.upsert>[0]["create"],
    update: data as Parameters<typeof prisma.notificationPreference.upsert>[0]["update"]
  });
  return NextResponse.json(pref);
}
