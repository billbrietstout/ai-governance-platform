import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DiscoveryReportPDF } from "@/lib/pdf/DiscoveryReportPDF";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { orgId?: string } | undefined;
  const orgId = user?.orgId;

  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing discovery id" }, { status: 400 });
  }

  const discovery = await prisma.regulationDiscovery.findFirst({
    where: { id, orgId },
    select: { results: true }
  });

  if (!discovery) {
    return NextResponse.json({ error: "Discovery not found" }, { status: 404 });
  }

  const results = discovery.results as {
    mandatory?: Array<{
      code: string;
      name: string;
      jurisdiction: string;
      applicability: string;
      keyRequirements?: string;
      deadline?: string;
      implementationEffort?: string;
    }>;
    likelyApplicable?: Array<{
      code: string;
      name: string;
      jurisdiction: string;
      applicability: string;
      keyRequirements?: string;
      deadline?: string;
      implementationEffort?: string;
    }>;
    recommended?: Array<{
      code: string;
      name: string;
      jurisdiction: string;
      applicability: string;
      keyRequirements?: string;
      deadline?: string;
      implementationEffort?: string;
    }>;
    requiredControls?: Array<{
      controlId: string;
      title: string;
      cosaiLayer: string;
      complianceStatus?: string;
    }>;
    estimatedMaturityRequired?: number;
    riskScore?: number;
  };

  const applicableRegulations: Array<{
    code: string;
    name: string;
    jurisdiction: string;
    applicability: string;
    keyRequirements?: string;
    deadline?: string;
    implementationEffort?: string;
  }> = [];
  if (results?.mandatory) {
    applicableRegulations.push(
      ...results.mandatory.map((r) => ({ ...r, applicability: "MANDATORY" }))
    );
  }
  if (results?.likelyApplicable) {
    applicableRegulations.push(
      ...results.likelyApplicable.map((r) => ({ ...r, applicability: "LIKELY_APPLICABLE" }))
    );
  }
  if (results?.recommended) {
    applicableRegulations.push(
      ...results.recommended.map((r) => ({ ...r, applicability: "RECOMMENDED" }))
    );
  }

  const requiredControls = results?.requiredControls ?? [];
  const implementationRoadmap = [
    "Assess applicability of identified regulations",
    "Map controls to CoSAI layers",
    "Assign accountability for each control",
    "Collect evidence and document compliance",
    "Schedule recurring compliance reviews"
  ];

  const generatedAt = new Date();
  const doc = React.createElement(DiscoveryReportPDF, {
    applicableRegulations,
    riskScore: results?.riskScore,
    estimatedMaturityRequired: results?.estimatedMaturityRequired,
    requiredControls,
    implementationRoadmap,
    generatedAt
  });

  const buffer = await renderToBuffer(doc);
  const date = generatedAt.toISOString().slice(0, 10);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="discovery-report-${date}.pdf"`
    }
  });
}
