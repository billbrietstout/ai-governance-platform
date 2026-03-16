/**
 * AI Risk Briefing – CEO-optimized view for any executive operating style.
 * Three traffic lights + one decision. No tables, no charts, plain English.
 */
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { prisma } from "@/lib/prisma";
import { AIRiskBriefingClient } from "./AIRiskBriefingClient";

export default async function ExecutiveDashboardPage() {
  const session = await auth();
  const user = session?.user as { orgId?: string } | undefined;
  const orgId = user?.orgId;

  if (!session || !orgId) {
    redirect("/login");
  }

  const caller = await createServerCaller();
  const [org, briefingRes] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: orgId },
      select: { name: true }
    }),
    caller.dashboard.getExecutiveBriefing()
  ]);

  const b = briefingRes?.data;
  if (!b) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
        <p className="text-slate-600">Unable to load briefing data. Please try again.</p>
      </div>
    );
  }

  const data = {
    orgName: org?.name ?? "Your organization",
    compliancePct: b.compliancePct,
    penaltyMin: b.penaltyMin,
    penaltyMax: b.penaltyMax,
    euHighRisk: b.euHighRisk,
    totalAssets: b.totalAssets,
    withoutAccountability: b.withoutAccountability,
    highRiskWithoutAccountability: b.highRiskWithoutAccountability,
    maturityLevel: b.maturityLevel,
    gapCount: b.gapCount,
    missingControlsPct: b.missingControlsPct,
    assetsByRisk: b.assetsByRisk ?? {},
    lastUpdated: b.lastUpdated
  };

  return <AIRiskBriefingClient data={data} />;
}
