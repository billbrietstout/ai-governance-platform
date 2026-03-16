import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AuditPackagePDF } from "@/lib/pdf/AuditPackagePDF";

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
      { error: "PRO tier or above required for audit package export" },
      { status: 403 }
    );
  }

  const [assets, snapshots, discoveries, risks] = await Promise.all([
    prisma.aIAsset.findMany({
      where: { orgId, deletedAt: null },
      select: {
        id: true,
        name: true,
        assetType: true,
        euRiskLevel: true,
        cosaiLayer: true,
        updatedAt: true
      }
    }),
    prisma.complianceSnapshot.findMany({
      where: { orgId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        overallScore: true,
        layerScores: true,
        frameworkCode: true,
        createdAt: true
      }
    }),
    prisma.regulationDiscovery.findMany({
      where: { orgId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { results: true }
    }),
    prisma.riskRegister.findMany({
      where: { orgId, deletedAt: null },
      select: { riskScore: true, likelihood: true, impact: true }
    })
  ]);

  const regulations: Array<{
    code: string;
    name: string;
    jurisdiction: string;
    applicability: string;
    keyRequirements?: string;
    deadline?: string;
  }> = [];
  for (const d of discoveries) {
    const r = d.results as {
      mandatory?: Array<{ code: string; name: string; jurisdiction: string; applicability: string; keyRequirements?: string; deadline?: string }>;
      likelyApplicable?: Array<{ code: string; name: string; jurisdiction: string; applicability: string; keyRequirements?: string; deadline?: string }>;
      recommended?: Array<{ code: string; name: string; jurisdiction: string; applicability: string; keyRequirements?: string; deadline?: string }>;
    };
    if (r?.mandatory) regulations.push(...r.mandatory.map((x) => ({ ...x, applicability: "MANDATORY" })));
    if (r?.likelyApplicable) regulations.push(...r.likelyApplicable.map((x) => ({ ...x, applicability: "LIKELY_APPLICABLE" })));
    if (r?.recommended) regulations.push(...r.recommended.map((x) => ({ ...x, applicability: "RECOMMENDED" })));
  }

  const assetIds = new Set(assets.map((a) => a.id));
  const accountabilityByAsset = await prisma.accountabilityAssignment.groupBy({
    by: ["assetId"],
    where: { assetId: { in: Array.from(assetIds) } },
    _count: true
  });
  const accMap = new Map(accountabilityByAsset.map((a) => [a.assetId, a._count]));

  let critical = 0,
    high = 0,
    medium = 0,
    low = 0;
  for (const r of risks) {
    const score = r.riskScore ?? (r.likelihood && r.impact ? (r.likelihood * r.impact) / 5 : 0);
    if (score >= 4) critical++;
    else if (score >= 3) high++;
    else if (score >= 2) medium++;
    else low++;
  }

  const layerCompliance = [
    { layer: "L1", owner: "—", score: 0, status: "—", keyGaps: [] as string[] },
    { layer: "L2", owner: "—", score: 0, status: "—", keyGaps: [] as string[] },
    { layer: "L3", owner: "—", score: 0, status: "—", keyGaps: [] as string[] },
    { layer: "L4", owner: "—", score: 0, status: "—", keyGaps: [] as string[] },
    { layer: "L5", owner: "—", score: 0, status: "—", keyGaps: [] as string[] }
  ];
  const latestSnapshot = snapshots[0];
  if (latestSnapshot?.layerScores && typeof latestSnapshot.layerScores === "object") {
    const ls = latestSnapshot.layerScores as Record<string, number>;
    ["L1", "L2", "L3", "L4", "L5"].forEach((l, i) => {
      layerCompliance[i]!.score = Math.round((ls[l] ?? 0) * 20);
      layerCompliance[i]!.status = layerCompliance[i]!.score >= 80 ? "Compliant" : layerCompliance[i]!.score >= 50 ? "Partial" : "Gaps";
    });
  }

  const evidenceRequirements = [
    { layer: "L1", artifact: "Business case & risk assessment", status: "Partial" as const },
    { layer: "L2", artifact: "Data classification & lineage", status: "Missing" as const },
    { layer: "L3", artifact: "Model card & accountability matrix", status: "Partial" as const },
    { layer: "L4", artifact: "Monitoring & drift detection", status: "Missing" as const },
    { layer: "L5", artifact: "Vendor assurance & provenance", status: "Missing" as const }
  ];

  const recommendations = [
    { priority: "P1", layer: "L2", action: "Complete data classification for AI training data", effort: "Medium", deadline: "30 days" },
    { priority: "P2", layer: "L3", action: "Document accountability matrix for high-risk assets", effort: "Low", deadline: "14 days" },
    { priority: "P3", layer: "L4", action: "Implement drift detection for production models", effort: "High", deadline: "60 days" }
  ];

  const keyFindings: string[] = [];
  if (assets.filter((a) => a.euRiskLevel === "HIGH").length > 0) {
    keyFindings.push("High-risk AI assets require additional documentation and oversight");
  }
  if (evidenceRequirements.some((e) => e.status === "Missing")) {
    keyFindings.push("Evidence gaps in data governance and model provenance");
  }
  if (regulations.some((r) => r.applicability === "MANDATORY")) {
    keyFindings.push("Mandatory regulations require compliance evidence collection");
  }

  const generatedAt = new Date();
  const doc = React.createElement(AuditPackagePDF, {
    org: {
      name: org.name,
      tier: org.tier ?? "FREE",
      maturityLevel: org.maturityLevel ?? 1
    },
    assets: assets.map((a) => ({
      id: a.id,
      name: a.name,
      assetType: a.assetType,
      euRiskLevel: a.euRiskLevel,
      cosaiLayer: a.cosaiLayer,
      accountability: (accMap.get(a.id) ?? 0) > 0 ? "Assigned" : undefined,
      lastReviewed: a.updatedAt?.toISOString().slice(0, 10)
    })),
    snapshots: snapshots.map((s) => ({
      id: s.id,
      overallScore: s.overallScore,
      layerScores: (s.layerScores as Record<string, number>) ?? {},
      frameworkCode: s.frameworkCode,
      createdAt: s.createdAt.toISOString()
    })),
    regulations,
    layerCompliance,
    evidenceRequirements,
    recommendations,
    riskSummary: { critical, high, medium, low },
    keyFindings: keyFindings.length > 0 ? keyFindings : ["No critical gaps identified"],
    generatedAt
  });

  const buffer = await renderToBuffer(doc);
  const date = generatedAt.toISOString().slice(0, 10);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="ai-posture-audit-${date}.pdf"`
    }
  });
}
