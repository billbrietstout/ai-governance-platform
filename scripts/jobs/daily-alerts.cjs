/**
 * scripts/jobs/daily-alerts.js
 * Daily alerts job — respects org kill switch, per-user preferences,
 * and sends critical/high alerts to Slack
 */

const { PrismaClient } = require("@prisma/client");
const { Resend } = require("resend");

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

const APP_URL = process.env.APP_URL || "https://ai-governance-platform-staging.up.railway.app";
const DRY_RUN = process.env.DRY_RUN === "true";
const MIN_SEVERITY = process.env.ALERT_SEVERITY || "medium";

const SEVERITY_ORDER = ["low", "medium", "high", "critical"];

function meetsMinSeverity(severity) {
  return SEVERITY_ORDER.indexOf(severity) >= SEVERITY_ORDER.indexOf(MIN_SEVERITY);
}

async function sendSlackAlert(webhookUrl, alert) {
  const config = {
    critical: { emoji: "🔴", color: "#E53E3E", label: "CRITICAL" },
    high: { emoji: "🟠", color: "#DD6B20", label: "HIGH" }
  }[alert.severity];

  const payload = {
    text: `${config.emoji} ${config.label} Alert: ${alert.title}`,
    attachments: [
      {
        color: config.color,
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: `${config.emoji} ${config.label} — ${alert.title}`,
              emoji: true
            }
          },
          {
            type: "section",
            fields: [
              { type: "mrkdwn", text: `*Organization:*\n${alert.organizationName}` },
              { type: "mrkdwn", text: `*Severity:*\n${config.label}` },
              ...(alert.systemName
                ? [{ type: "mrkdwn", text: `*AI System:*\n${alert.systemName}` }]
                : []),
              ...(alert.layer
                ? [{ type: "mrkdwn", text: `*CoSAI SRF Layer:*\n${alert.layer}` }]
                : [])
            ]
          },
          {
            type: "section",
            text: { type: "mrkdwn", text: `*Details:*\n${alert.description}` }
          },
          {
            type: "actions",
            elements: [
              {
                type: "button",
                text: { type: "plain_text", text: "View in Platform →", emoji: true },
                url: `${APP_URL}/dashboard`,
                style: alert.severity === "critical" ? "danger" : "primary"
              }
            ]
          },
          {
            type: "context",
            elements: [{ type: "mrkdwn", text: `AI Readiness Platform · Built on CoSAI SRF v0.7` }]
          }
        ]
      }
    ]
  };

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  return res.ok;
}

async function generateAlertsForOrg(org) {
  const alerts = [];

  // Check for unowned high-risk systems
  const unownedSystems = await prisma.aISystem
    .findMany({
      where: {
        organizationId: org.id,
        riskLevel: { in: ["HIGH", "CRITICAL"] },
        OR: [{ ownerId: null }, { owner: null }]
      },
      select: { id: true, name: true, riskLevel: true, cosaiLayer: true },
      take: 5
    })
    .catch(() => []);

  for (const system of unownedSystems) {
    alerts.push({
      severity: system.riskLevel.toLowerCase(),
      title: "Unowned High-Risk AI System",
      description: `${system.name} is classified as ${system.riskLevel} risk but has no assigned accountability owner.`,
      systemName: system.name,
      layer: system.cosaiLayer
    });
  }

  // Check for compliance score drops (mock — replace with real query)
  const recentScoreDrop = await prisma.complianceScore
    .findFirst({
      where: {
        organizationId: org.id,
        dropAmount: { gte: 10 },
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }
    })
    .catch(() => null);

  if (recentScoreDrop) {
    alerts.push({
      severity: "high",
      title: "Compliance Score Drop",
      description: `Your compliance score dropped by ${recentScoreDrop.dropAmount} points in the last 24 hours.`
    });
  }

  // Check for upcoming regulatory deadlines
  const upcomingDeadlines = await prisma.regulatoryDeadline
    .findMany({
      where: {
        organizationId: org.id,
        dueDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      },
      select: { name: true, dueDate: true, regulation: true },
      take: 3
    })
    .catch(() => []);

  for (const deadline of upcomingDeadlines) {
    alerts.push({
      severity: "critical",
      title: `Regulatory Deadline in 7 Days`,
      description: `${deadline.name} (${deadline.regulation}) is due on ${new Date(deadline.dueDate).toLocaleDateString()}.`
    });
  }

  return alerts;
}

async function main() {
  console.log(
    `[daily-alerts] Starting ${DRY_RUN ? "(DRY RUN) " : ""}— ${new Date().toISOString()}`
  );

  const organizations = await prisma.organization.findMany({
    where: { emailNotificationsEnabled: true },
    include: {
      users: {
        where: { emailEnabled: true, unsubscribedAt: null },
        select: {
          id: true,
          email: true,
          name: true,
          unsubscribeToken: true,
          alertPreferences: true
        }
      }
    }
  });

  console.log(`[daily-alerts] Processing ${organizations.length} organizations`);

  let totalEmailsSent = 0;
  let totalSlackSent = 0;
  let totalSkipped = 0;

  for (const org of organizations) {
    const alerts = await generateAlertsForOrg(org);
    const filteredAlerts = alerts.filter((a) => meetsMinSeverity(a.severity));

    if (filteredAlerts.length === 0) {
      console.log(`[daily-alerts] No alerts for ${org.name}`);
      continue;
    }

    console.log(`[daily-alerts] ${org.name}: ${filteredAlerts.length} alerts`);

    // Send Slack for critical/high alerts
    const slackAlerts = filteredAlerts.filter((a) => ["critical", "high"].includes(a.severity));
    if (org.slackEnabled && org.slackWebhookUrl && slackAlerts.length > 0) {
      for (const alert of slackAlerts) {
        if (DRY_RUN) {
          console.log(`[dry-run] Would send Slack alert: ${alert.title}`);
        } else {
          const ok = await sendSlackAlert(org.slackWebhookUrl, {
            ...alert,
            organizationName: org.name
          });
          if (ok) {
            totalSlackSent++;
            console.log(`[daily-alerts] Slack alert sent: ${alert.title}`);
          }
          await new Promise((r) => setTimeout(r, 1100));
        }
      }
    }

    // Send email to each eligible user
    for (const user of org.users) {
      const userAlerts = filteredAlerts.filter((alert) => {
        const prefMap = {
          "Unowned High-Risk AI System": "newUnownedSystem",
          "Compliance Score Drop": "complianceScoreDrop",
          "Regulatory Deadline in 7 Days": "deadline7Days"
        };
        const prefKey = prefMap[alert.title];
        if (!prefKey) return true;
        return user.alertPreferences?.[prefKey] !== false;
      });

      if (userAlerts.length === 0) {
        totalSkipped++;
        continue;
      }

      const unsubscribeUrl = user.unsubscribeToken
        ? `${APP_URL}/api/notifications/unsubscribe?token=${user.unsubscribeToken}`
        : `${APP_URL}/settings/notifications`;

      const alertRows = userAlerts
        .map(
          (a) => `
        <tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #f3f4f6;">
            <span style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 600; background: ${a.severity === "critical" ? "#FEE2E2" : a.severity === "high" ? "#FFEDD5" : "#FEF9C3"}; color: ${a.severity === "critical" ? "#991B1B" : a.severity === "high" ? "#9A3412" : "#854D0E"};">
              ${a.severity.toUpperCase()}
            </span>
          </td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #f3f4f6; font-size: 14px; color: #111827; font-weight: 500;">${a.title}</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #f3f4f6; font-size: 13px; color: #6B7280;">${a.description}</td>
        </tr>
      `
        )
        .join("");

      const html = `
        <!DOCTYPE html>
        <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; margin: 0; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="padding: 24px 32px; border-bottom: 1px solid #f3f4f6; text-align: center;">
              <p style="margin: 0; font-size: 11px; font-weight: 600; letter-spacing: 0.1em; color: #9CA3AF; text-transform: uppercase;">AI Readiness Platform</p>
              <h1 style="margin: 8px 0 4px; font-size: 22px; font-weight: 700; color: #111827;">Daily Alert Summary</h1>
              <p style="margin: 0; font-size: 14px; color: #6B7280;">${org.name} · ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
            </div>

            <div style="padding: 24px 32px;">
              <p style="font-size: 14px; color: #374151; margin: 0 0 16px;">
                Hi ${user.name || "there"}, you have <strong>${userAlerts.length} alert${userAlerts.length !== 1 ? "s" : ""}</strong> requiring attention.
              </p>

              <table style="width: 100%; border-collapse: collapse; border: 1px solid #f3f4f6; border-radius: 8px; overflow: hidden;">
                <thead>
                  <tr style="background: #f9fafb;">
                    <th style="padding: 10px 16px; text-align: left; font-size: 11px; font-weight: 600; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.05em;">Severity</th>
                    <th style="padding: 10px 16px; text-align: left; font-size: 11px; font-weight: 600; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.05em;">Alert</th>
                    <th style="padding: 10px 16px; text-align: left; font-size: 11px; font-weight: 600; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.05em;">Details</th>
                  </tr>
                </thead>
                <tbody>${alertRows}</tbody>
              </table>

              <div style="margin-top: 24px; text-align: center;">
                <a href="${APP_URL}/dashboard" style="display: inline-block; padding: 12px 24px; background: #111827; color: white; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 500;">
                  View dashboard →
                </a>
              </div>
            </div>

            <div style="padding: 16px 32px; border-top: 1px solid #f3f4f6; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #9CA3AF;">
                <a href="${unsubscribeUrl}" style="color: #9CA3AF;">Unsubscribe from all emails</a>
                &nbsp;·&nbsp;
                <a href="${APP_URL}/settings/notifications" style="color: #9CA3AF;">Manage preferences</a>
              </p>
              <p style="margin: 6px 0 0; font-size: 11px; color: #D1D5DB;">AI Readiness Platform · Built on CoSAI SRF v0.7</p>
            </div>
          </div>
        </body>
        </html>
      `;

      if (DRY_RUN) {
        console.log(`[dry-run] Would send ${userAlerts.length} alerts to ${user.email}`);
        totalSkipped++;
      } else {
        try {
          await resend.emails.send({
            from: "AI Readiness Platform <alerts@yourdomain.com>",
            to: user.email,
            subject: `${userAlerts.filter((a) => a.severity === "critical").length > 0 ? "🔴" : "🟠"} ${userAlerts.length} AI governance alert${userAlerts.length !== 1 ? "s" : ""} — ${org.name}`,
            html
          });
          totalEmailsSent++;
          console.log(`[daily-alerts] Email sent to ${user.email}`);
        } catch (err) {
          console.error(`[daily-alerts] Failed to send to ${user.email}:`, err.message);
        }
      }
    }
  }

  console.log(
    `[daily-alerts] Complete — emails: ${totalEmailsSent}, slack: ${totalSlackSent}, skipped: ${totalSkipped}`
  );
}

main()
  .catch((err) => {
    console.error("[daily-alerts] Fatal:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
