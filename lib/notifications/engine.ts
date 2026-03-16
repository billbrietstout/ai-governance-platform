import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email/resend";
import { weeklyDigestTemplate } from "@/lib/email/templates/weekly-digest";
import { thresholdAlertTemplate } from "@/lib/email/templates/threshold-alert";
import { deadlineReminderTemplate } from "@/lib/email/templates/deadline-reminder";

const BASE_URL =
  process.env.NEXTAUTH_URL ?? "https://ai-governance-platform-staging.up.railway.app";

export async function sendWeeklyDigests() {
  const prefs = await prisma.notificationPreference.findMany({
    where: {
      weeklyDigest: true,
      emailEnabled: true
    },
    include: { user: true }
  });

  for (const pref of prefs) {
    try {
      await sendWeeklyDigestToUser(
        { id: pref.user.id, email: pref.user.email },
        pref.orgId
      );
    } catch (err) {
      console.error(`Digest failed for ${pref.user.email}:`, err);
    }
  }
}

export async function sendWeeklyDigestToUser(
  user: { id?: string; email: string },
  orgId: string
) {
  const [org, assets, snapshots, discoveries] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: orgId },
      select: { name: true, maturityLevel: true, notificationsEnabled: true }
    }),
    prisma.aIAsset.findMany({
      where: { orgId, deletedAt: null },
      select: { euRiskLevel: true, ownerId: true }
    }),
    prisma.complianceSnapshot.findFirst({
      where: { orgId },
      orderBy: { createdAt: "desc" },
      select: { overallScore: true }
    }),
    prisma.regulationDiscovery.findFirst({
      where: { orgId },
      orderBy: { createdAt: "desc" }
    })
  ]);

  if (!org) return;
  if (!org.notificationsEnabled) {
    console.log(`Notifications disabled for org ${orgId}`);
    return;
  }

  const highRiskUnowned = assets.filter(
    (a) =>
      (a.euRiskLevel === "HIGH" || a.euRiskLevel === "UNACCEPTABLE") && !a.ownerId
  ).length;

  const overallScore = snapshots?.overallScore ?? 0;
  const maturityLevel = org.maturityLevel ?? 1;
  const mandatoryRegs =
    (discoveries?.results as { mandatory?: unknown[] } | null)?.mandatory?.length ?? 0;

  const regulatoryLight =
    mandatoryRegs > 0 && overallScore < 60
      ? "RED"
      : mandatoryRegs > 0
        ? "AMBER"
        : "GREEN";

  const operationalLight =
    highRiskUnowned > 0
      ? "RED"
      : assets.filter((a) => !a.ownerId).length > 5
        ? "AMBER"
        : "GREEN";

  const readinessLight =
    maturityLevel < 2 ? "RED" : maturityLevel < 3 ? "AMBER" : "GREEN";

  const regulatoryText =
    mandatoryRegs > 0 && overallScore < 60
      ? `${mandatoryRegs} mandatory regulations apply. Current compliance: ${overallScore}%. Action required before deadline.`
      : mandatoryRegs > 0
        ? `${mandatoryRegs} regulations apply. Compliance at ${overallScore}% — on track.`
        : "No mandatory regulations identified for your current AI systems.";

  const operationalText =
    highRiskUnowned > 0
      ? `${highRiskUnowned} high-risk AI systems have no accountability owner assigned.`
      : assets.filter((a) => !a.ownerId).length > 0
        ? `${assets.filter((a) => !a.ownerId).length} AI systems need accountability owners.`
        : `${assets.length} AI systems active. All accountability owners assigned.`;

  const maturityLabels: Record<number, string> = {
    1: "Awareness only — no formal controls yet",
    2: "Basic controls in place",
    3: "Controls implemented and tested",
    4: "Measured and managed",
    5: "Optimised — industry leading"
  };

  const readinessText =
    maturityLevel < 3
      ? `${maturityLabels[maturityLevel] ?? "Basic controls"}. You need level 3 to meet regulatory requirements by August 2026.`
      : `${maturityLabels[maturityLevel] ?? "Strong controls"}. Your readiness program is on track.`;

  const decisionItem =
    highRiskUnowned > 0
      ? `Assign accountability owners to ${highRiskUnowned} high-risk AI systems`
      : mandatoryRegs > 0 && overallScore < 40
        ? "Review EU AI Act compliance roadmap with your team"
        : null;

  const displayName = user.email.split("@")[0];
  const html = weeklyDigestTemplate({
    orgName: org.name,
    recipientName: displayName,
    regulatoryLight,
    regulatoryText,
    operationalLight,
    operationalText,
    readinessLight,
    readinessText,
    decisionItem,
    baseUrl: BASE_URL,
    unsubscribeUrl: `${BASE_URL}/api/v1/notifications/unsubscribe?email=${encodeURIComponent(user.email)}`
  });

  await sendEmail({
    to: user.email,
    subject: `AI Risk Briefing — ${org.name} — Week of ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
    html
  });

  await prisma.notificationLog.create({
    data: {
      orgId,
      userId: user.id ?? null,
      type: "WEEKLY_DIGEST",
      subject: `AI Risk Briefing — ${org.name}`,
      status: "SENT"
    }
  });
}

export async function checkThresholdAlerts() {
  const orgs = await prisma.organization.findMany({
    select: { id: true, name: true }
  });

  for (const org of orgs) {
    await checkOrgAlerts(org.id, org.name);
  }
}

async function checkOrgAlerts(orgId: string, orgName: string) {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { notificationsEnabled: true }
  });
  if (!org?.notificationsEnabled) {
    console.log(`Notifications disabled for org ${orgId}`);
    return;
  }
  const prefs = await prisma.notificationPreference.findMany({
    where: {
      orgId,
      emailEnabled: true,
      newUnownedHighRisk: true
    },
    include: { user: true }
  });

  if (prefs.length === 0) return;

  const unownedHighRisk = await prisma.aIAsset.count({
    where: {
      orgId,
      deletedAt: null,
      euRiskLevel: { in: ["HIGH", "UNACCEPTABLE"] },
      ownerId: null
    }
  });

  if (unownedHighRisk > 0) {
    for (const pref of prefs) {
      const html = thresholdAlertTemplate({
        orgName,
        alertType: "HIGH",
        alertTitle: `${unownedHighRisk} high-risk AI systems need owners`,
        alertDescription: `${unownedHighRisk} AI systems classified as high-risk do not have an accountability owner assigned. This creates compliance and liability exposure.`,
        actionUrl: `${BASE_URL}/dashboard/executive`,
        actionLabel: "Assign owners →",
        baseUrl: BASE_URL
      });

      await sendEmail({
        to: pref.user.email,
        subject: `Action required: ${unownedHighRisk} high-risk AI systems unowned — ${orgName}`,
        html
      });
    }
  }
}

export async function checkDeadlineReminders() {
  const DEADLINE_DAYS = [90, 30, 7];
  const EU_AI_ACT_DEADLINE = new Date("2026-08-02");
  const today = new Date();
  const daysToDeadline = Math.ceil(
    (EU_AI_ACT_DEADLINE.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (!DEADLINE_DAYS.includes(daysToDeadline)) return;

  const deadlineField =
    daysToDeadline === 90
      ? { regulatoryDeadline90: true }
      : daysToDeadline === 30
        ? { regulatoryDeadline30: true }
        : { regulatoryDeadline7: true };

  const orgs = await prisma.organization.findMany({
    select: { id: true, name: true }
  });

  for (const org of orgs) {
    const orgRecord = await prisma.organization.findUnique({
      where: { id: org.id },
      select: { notificationsEnabled: true }
    });
    if (!orgRecord?.notificationsEnabled) {
      console.log(`Notifications disabled for org ${org.id}`);
      continue;
    }
    const prefs = await prisma.notificationPreference.findMany({
      where: {
        orgId: org.id,
        emailEnabled: true,
        ...deadlineField
      },
      include: { user: true }
    });

    if (prefs.length === 0) continue;

    const snapshot = await prisma.complianceSnapshot.findFirst({
      where: { orgId: org.id },
      orderBy: { createdAt: "desc" },
      select: { overallScore: true }
    });

    for (const pref of prefs) {
      const html = deadlineReminderTemplate({
        orgName: org.name,
        regulationName: "EU AI Act — High Risk Systems",
        deadline: EU_AI_ACT_DEADLINE.toISOString(),
        daysRemaining: daysToDeadline,
        complianceScore: snapshot?.overallScore ?? 0,
        actionUrl: `${BASE_URL}/compliance/eu-ai-act`,
        baseUrl: BASE_URL
      });

      await sendEmail({
        to: pref.user.email,
        subject: `${daysToDeadline} days to EU AI Act deadline — ${org.name}`,
        html
      });
    }
  }
}
