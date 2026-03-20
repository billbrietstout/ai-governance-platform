import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendSlackTest } from "@/lib/slack";
import crypto from "crypto";

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
      data: { userId: user.id, orgId: user.orgId, weeklyDigest: true, emailEnabled: true }
    });
  }

  // Ensure user has an unsubscribe token
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { unsubscribeToken: true }
  });
  if (!dbUser?.unsubscribeToken) {
    await prisma.user.update({
      where: { id: user.id },
      data: { unsubscribeToken: crypto.randomBytes(32).toString("hex") }
    });
  }

  // Include org-level settings
  const org = await prisma.organization.findUnique({
    where: { id: user.orgId },
    select: { notificationsEnabled: true, slackEnabled: true, slackWebhookUrl: true }
  });

  return NextResponse.json({
    ...pref,
    org: {
      notificationsEnabled: org?.notificationsEnabled ?? true,
      slackEnabled: org?.slackEnabled ?? false,
      slackConfigured: !!org?.slackWebhookUrl
    }
  });
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
  const user = session?.user as { id?: string; orgId?: string; role?: string } | undefined;
  if (!user?.id || !user?.orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as Record<string, unknown>;
  const data: Record<string, unknown> = {};

  for (const k of PREF_KEYS) {
    if (body[k] !== undefined) data[k] = body[k];
  }

  // Handle re-subscribe (clear unsubscribedAt)
  if (data.emailEnabled === true) {
    await prisma.user.update({
      where: { id: user.id },
      data: { unsubscribedAt: null }
    });
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

  // Org-level updates — admin/owner only
  const isAdmin = ["ADMIN", "OWNER"].includes(user.role ?? "");
  if (isAdmin) {
    const orgUpdates: Record<string, unknown> = {};

    if (typeof body.orgNotificationsEnabled === "boolean") {
      orgUpdates.notificationsEnabled = body.orgNotificationsEnabled;
    }
    if (typeof body.slackEnabled === "boolean") {
      orgUpdates.slackEnabled = body.slackEnabled;
    }
    if (body.orgSlackWebhookUrl !== undefined) {
      orgUpdates.slackWebhookUrl = body.orgSlackWebhookUrl || null;
    }

    if (Object.keys(orgUpdates).length > 0) {
      await prisma.organization.update({
        where: { id: user.orgId },
        data: orgUpdates
      });
    }

    // Test Slack webhook
    if (body.testSlack === true) {
      const org = await prisma.organization.findUnique({
        where: { id: user.orgId },
        select: { name: true, slackWebhookUrl: true }
      });
      const webhookUrl = (body.orgSlackWebhookUrl as string) || org?.slackWebhookUrl;
      if (!webhookUrl) {
        return NextResponse.json({ error: "No Slack webhook URL configured" }, { status: 400 });
      }
      const result = await sendSlackTest(webhookUrl, org?.name ?? "Your Organization");
      return NextResponse.json({ success: result.success, slackTest: result });
    }
  }

  return NextResponse.json(pref);
}
