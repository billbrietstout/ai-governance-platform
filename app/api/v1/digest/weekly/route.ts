/**
 * Weekly AI Risk Briefing digest – HTML email for CEO/CFO/COO personas.
 * GET /api/v1/digest/weekly?orgId=xxx
 * Optional: ?cronSecret=xxx for cron auth (set CRON_SECRET env).
 * Returns HTML suitable for email. Cron (e.g. Railway) can call this and
 * forward to an email service.
 */
import { NextResponse } from "next/server";
import { env } from "@/env";
import { prisma } from "@/lib/prisma";
import { getExecutiveBriefingData } from "@/lib/executive-briefing";

const BASE_URL = env.AUTH_URL ?? "https://app.example.com";

const MATURITY_PLAIN: Record<number, string> = {
  1: "aware of AI risks but no formal governance yet",
  2: "basic governance in place — policies and documentation",
  3: "governance implemented — controls and accountability assigned",
  4: "measuring and monitoring — continuous improvement",
  5: "optimised — mature AI governance program"
};

function getLegalStatus(data: {
  penaltyMax: number;
  compliancePct: number;
  euHighRisk: number;
}): "red" | "amber" | "green" {
  if (data.penaltyMax > 10_000_000) return "red";
  if (data.compliancePct < 60 && data.euHighRisk > 0) return "red";
  if (data.penaltyMax >= 1_000_000 && data.penaltyMax <= 10_000_000) return "amber";
  if (data.compliancePct < 80 && data.euHighRisk > 0) return "amber";
  return "green";
}

function getSafetyStatus(data: {
  highRiskWithoutAccountability: number;
  missingControlsPct: number;
}): "red" | "amber" | "green" {
  if (data.highRiskWithoutAccountability > 0) return "red";
  if (data.missingControlsPct > 20) return "amber";
  return "green";
}

function getReadinessStatus(data: { maturityLevel: number }): "red" | "amber" | "green" {
  if (data.maturityLevel < 2) return "red";
  if (data.maturityLevel === 2) return "amber";
  return "green";
}

function getPriorityDecision(data: {
  highRiskWithoutAccountability: number;
  gapCount: number;
  maturityLevel: number;
  withoutAccountability: number;
}): string {
  if (data.highRiskWithoutAccountability > 0) {
    return `Assign someone responsible for ${data.highRiskWithoutAccountability} high-risk AI system${data.highRiskWithoutAccountability === 1 ? "" : "s"}`;
  }
  if (data.gapCount > 0) {
    return "Address accountability gaps before the EU high-risk AI rules deadline";
  }
  if (data.maturityLevel < 3) {
    return "Complete your governance assessment to meet regulatory requirements";
  }
  if (data.withoutAccountability > 0) {
    return `Assign owners for ${data.withoutAccountability} AI system${data.withoutAccountability === 1 ? "" : "s"} with no one responsible`;
  }
  return "Nothing urgent this week.";
}

function renderDigestHtml(
  orgName: string,
  weekLabel: string,
  data: Awaited<ReturnType<typeof getExecutiveBriefingData>>
): string {
  const legalStatus = getLegalStatus(data);
  const safetyStatus = getSafetyStatus(data);
  const readinessStatus = getReadinessStatus(data);
  const decision = getPriorityDecision(data);

  const legalSummary =
    data.euHighRisk > 0
      ? `EU high-risk AI rules apply to ${data.euHighRisk} of your AI systems. Deadline: August 2026. Current readiness: ${data.compliancePct}%.`
      : "No AI systems fall under mandatory EU high-risk rules. Voluntary standards apply.";

  const safetySummary =
    data.totalAssets > 0
      ? `${data.totalAssets} AI systems are active. ${data.gapCount > 0 ? `${data.gapCount} have unresolved accountability gaps.` : "All systems have accountability owners."} No critical incidents this month.`
      : "No AI systems in production yet.";

  const maturityLabel = MATURITY_PLAIN[data.maturityLevel] ?? "basic governance in place";
  const readinessSummary =
    data.maturityLevel < 5
      ? `Your AI readiness: ${maturityLabel}. You need implemented controls to meet regulatory requirements by August 2026.`
      : "Your AI readiness program is mature. Keep up the good work.";

  const dot = (s: "red" | "amber" | "green") => {
    const c = s === "red" ? "#ef4444" : s === "amber" ? "#f59e0b" : "#10b981";
    return `<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${c};vertical-align:middle;"></span>`;
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>AI Risk Briefing — ${orgName}</title>
</head>
<body style="font-family:system-ui,-apple-system,sans-serif;font-size:16px;line-height:1.5;color:#334155;max-width:600px;margin:0 auto;padding:24px;">
  <h1 style="font-size:1.5rem;font-weight:600;color:#0f172a;margin:0 0 4px 0;">AI Risk Briefing — ${orgName}</h1>
  <p style="margin:0 0 8px 0;font-size:0.875rem;color:#64748b;">${weekLabel}</p>

  <div style="margin:24px 0;padding:16px;border:1px solid #e2e8f0;border-radius:8px;background:#fff;">
    <h2 style="font-size:0.875rem;font-weight:600;color:#475569;margin:0 0 8px 0;">Legal & Regulatory Exposure</h2>
    <p style="margin:0;">${dot(legalStatus)} ${legalSummary}</p>
  </div>

  <div style="margin:24px 0;padding:16px;border:1px solid #e2e8f0;border-radius:8px;background:#fff;">
    <h2 style="font-size:0.875rem;font-weight:600;color:#475569;margin:0 0 8px 0;">Operational Safety</h2>
    <p style="margin:0;">${dot(safetyStatus)} ${safetySummary}</p>
  </div>

  <div style="margin:24px 0;padding:16px;border:1px solid #e2e8f0;border-radius:8px;background:#fff;">
    <h2 style="font-size:0.875rem;font-weight:600;color:#475569;margin:0 0 8px 0;">Readiness Progress</h2>
    <p style="margin:0;">${dot(readinessStatus)} ${readinessSummary}</p>
  </div>

  <div style="margin:24px 0;padding:16px;border:2px solid #1e3a5f;border-radius:8px;background:#f8fafc;">
    <h2 style="font-size:0.875rem;font-weight:600;color:#0f172a;margin:0 0 8px 0;">One thing that needs your attention</h2>
    <p style="margin:0;">${decision}</p>
    <p style="margin:12px 0 0 0;font-size:0.875rem;">
      <a href="${BASE_URL}/dashboard/executive" style="color:#1e3a5f;font-weight:500;">Review and decide →</a>
    </p>
  </div>

  <p style="margin:24px 0 0 0;font-size:0.75rem;color:#94a3b8;">
    <a href="${process.env.AUTH_URL ?? "https://app.example.com"}/dashboard?view=full" style="color:#64748b;">Full governance dashboard</a> ·
    <a href="${BASE_URL}/api/v1/export/governance-report" style="color:#64748b;">Export board briefing</a>
  </p>
</body>
</html>
`.trim();
}

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orgId = searchParams.get("orgId");
  const cronSecret = searchParams.get("cronSecret");
  const expectSecret = process.env.CRON_SECRET;

  if (expectSecret && cronSecret !== expectSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgIds: string[] = orgId
    ? [orgId]
    : (await prisma.organization.findMany({ select: { id: true } })).map((o) => o.id);

  if (orgIds.length === 0) {
    return NextResponse.json({ error: "No organizations found" }, { status: 404 });
  }

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekLabel = `Week of ${weekStart.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`;
  const subject = `AI Risk Briefing — Week of ${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  const results: { orgId: string; orgName: string; html: string; recipients: string[] }[] = [];

  for (const oid of orgIds) {
    const [org, briefing, recipients] = await Promise.all([
      prisma.organization.findUnique({
        where: { id: oid },
        select: { name: true }
      }),
      getExecutiveBriefingData(prisma, oid),
      prisma.user.findMany({
        where: {
          orgId: oid,
          persona: { in: ["CEO", "CFO", "COO"] }
        },
        select: { email: true }
      })
    ]);

    const orgName = org?.name ?? "Your organization";
    const html = renderDigestHtml(orgName, weekLabel, briefing);
    results.push({
      orgId: oid,
      orgName,
      html,
      recipients: recipients.map((r) => r.email).filter(Boolean) as string[]
    });
  }

  if (orgIds.length === 1 && results[0]) {
    const r = results[0];
    return new NextResponse(r.html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "X-Digest-Subject": `AI Risk Briefing — ${r.orgName} — ${subject}`,
        "X-Digest-Recipients": r.recipients.join(",")
      }
    });
  }

  return NextResponse.json({
    digests: results.map((r) => ({
      orgId: r.orgId,
      orgName: r.orgName,
      recipients: r.recipients,
      subject: `AI Risk Briefing — ${r.orgName} — ${subject}`
    }))
  });
}
