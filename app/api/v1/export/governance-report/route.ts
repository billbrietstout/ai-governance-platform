import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { GovernanceReportPDF } from "@/lib/pdf/GovernanceReportPDF";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const user = session?.user as { orgId?: string } | undefined;
  const orgId = user?.orgId;

  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { name: true, tier: true, maturityLevel: true }
  });

  if (!org) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  const tier = (org.tier ?? "FREE").toUpperCase();
  if (tier !== "PRO" && tier !== "CONSULTANT" && tier !== "ENTERPRISE") {
    return NextResponse.json(
      { error: "PRO tier or above required for governance report export" },
      { status: 403 }
    );
  }

  const [maturity, risks, snapshots] = await Promise.all([
    prisma.maturityAssessment.findFirst({
      where: { orgId },
      orderBy: { createdAt: "desc" },
      select: { scores: true, maturityLevel: true }
    }),
    prisma.riskRegister.findMany({
      where: { orgId, deletedAt: null },
      select: {
        title: true,
        cosaiLayer: true,
        riskScore: true,
        status: true,
        owner: true
      }
    }),
    prisma.complianceSnapshot.findMany({
      where: { orgId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { frameworkCode: true, overallScore: true, createdAt: true }
    })
  ]);

  const scores = (maturity?.scores as Record<string, number>) ?? {};
  const maturityScores = {
    L1: scores.L1 ?? 0,
    L2: scores.L2 ?? 0,
    L3: scores.L3 ?? 0,
    L4: scores.L4 ?? 0,
    L5: scores.L5 ?? 0,
    overall: maturity?.maturityLevel ?? 1
  };

  const layerMap: Record<string, string> = {
    LAYER_1_BUSINESS: "L1",
    LAYER_2_INFORMATION: "L2",
    LAYER_3_APPLICATION: "L3",
    LAYER_4_PLATFORM: "L4",
    LAYER_5_SUPPLY_CHAIN: "L5"
  };
  const topRisks = risks.map((r) => ({
    title: r.title,
    layer: layerMap[r.cosaiLayer ?? ""] ?? "L3",
    severity:
      (r.riskScore ?? 0) >= 4 ? "Critical" : (r.riskScore ?? 0) >= 3 ? "High" : "Medium",
    status: r.status,
    owner: r.owner ?? undefined
  }));

  const complianceTrend = snapshots.map((s) => ({
    frameworkCode: s.frameworkCode,
    overallScore: s.overallScore,
    createdAt: s.createdAt.toISOString().slice(0, 10)
  }));

  const nextSteps = [
    { action: "Complete data classification for AI assets", effort: "Medium", impact: "High" },
    { action: "Document accountability matrix for high-risk systems", effort: "Low", impact: "High" },
    { action: "Implement drift detection for production models", effort: "High", impact: "Medium" }
  ];

  const generatedAt = new Date();
  const doc = React.createElement(GovernanceReportPDF, {
    org: {
      name: org.name,
      tier: org.tier ?? "FREE",
      maturityLevel: org.maturityLevel ?? maturity?.maturityLevel ?? 1
    },
    maturityScores,
    topRisks,
    complianceTrend,
    nextSteps,
    generatedAt
  });

  const buffer = await renderToBuffer(doc as any);
  const date = generatedAt.toISOString().slice(0, 10);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="ai-readiness-governance-report-${date}.pdf"`
    }
  });
}
