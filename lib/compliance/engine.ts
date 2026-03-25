/**
 * Compliance engine – score, gap analysis, cross-framework mapping.
 */
import type { PrismaClient } from "@prisma/client";

import { loadActiveFrameworksForOrg, loadFrameworkMetaByIds } from "./framework-queries";

export type ScoreResult = {
  score: number;
  total: number;
  percentage: number;
  gaps: Gap[];
  byLayer: Record<string, { score: number; total: number; percentage: number }>;
};

export type Gap = {
  controlId: string;
  frameworkId: string;
  frameworkCode: string;
  title: string;
  cosaiLayer: string | null;
  /** NIST SP 800-53 Rev 5 control family — semantic backbone for SSP/RMF alignment */
  nist80053Family: string | null;
  status: string;
};

export type GapReport = {
  byFramework: Record<string, { attested: number; total: number; gaps: Gap[] }>;
  byLayer: Record<string, { attested: number; total: number; gaps: Gap[] }>;
  /** Open gaps grouped by NIST SP 800-53 family (UNSPECIFIED if unmapped) */
  gapsByNist80053Family: Record<string, Gap[]>;
  criticalGaps: Gap[];
  recommendations: string[];
};

export type RelatedControl = {
  controlId: string;
  frameworkCode: string;
  frameworkName: string;
  title: string;
};

export async function calculateComplianceScore(
  prisma: PrismaClient,
  assetId: string,
  frameworkId?: string
): Promise<ScoreResult> {
  const asset = await prisma.aIAsset.findFirst({
    where: { id: assetId, deletedAt: null },
    select: { orgId: true }
  });
  if (!asset) {
    return { score: 0, total: 0, percentage: 0, gaps: [], byLayer: {} };
  }

  const frameworks = await loadActiveFrameworksForOrg(prisma, asset.orgId, {
    frameworkId
  });

  const controlIds = await prisma.control.findMany({
    where: { frameworkId: { in: frameworks.map((f) => f.id) } },
    select: {
      id: true,
      controlId: true,
      frameworkId: true,
      title: true,
      cosaiLayer: true,
      nist80053Family: true
    }
  });

  const attestations = await prisma.controlAttestation.findMany({
    where: { assetId, controlId: { in: controlIds.map((c) => c.id) } },
    select: { controlId: true, status: true }
  });

  const attestedMap = new Map(
    attestations
      .filter((a) => a.status === "COMPLIANT" || a.status === "NOT_APPLICABLE")
      .map((a) => [a.controlId, a.status])
  );

  const gaps: Gap[] = [];
  const byLayer: Record<string, { score: number; total: number }> = {};

  for (const c of controlIds) {
    const layer = c.cosaiLayer ?? "UNSPECIFIED";
    if (!byLayer[layer]) byLayer[layer] = { score: 0, total: 0 };
    byLayer[layer].total++;
    const status = attestedMap.get(c.id);
    if (status === "COMPLIANT" || status === "NOT_APPLICABLE") {
      byLayer[layer].score++;
    } else {
      const fw = frameworks.find((f) => f.id === c.frameworkId);
      gaps.push({
        controlId: c.controlId,
        frameworkId: c.frameworkId,
        frameworkCode: fw?.code ?? "",
        title: c.title,
        cosaiLayer: c.cosaiLayer,
        nist80053Family: c.nist80053Family ?? null,
        status: status ?? "PENDING"
      });
    }
  }

  const total = controlIds.length;
  const score = total - gaps.length;
  const byLayerResult: Record<string, { score: number; total: number; percentage: number }> = {};
  for (const [layer, v] of Object.entries(byLayer)) {
    byLayerResult[layer] = {
      ...v,
      percentage: v.total > 0 ? Math.round((v.score / v.total) * 100) : 0
    };
  }

  return {
    score,
    total,
    percentage: total > 0 ? Math.round((score / total) * 100) : 0,
    gaps,
    byLayer: byLayerResult
  };
}

export async function getGapAnalysis(prisma: PrismaClient, assetId: string): Promise<GapReport> {
  const result = await calculateComplianceScore(prisma, assetId);
  const byFramework: Record<string, { attested: number; total: number; gaps: Gap[] }> = {};
  const byLayer: Record<string, { attested: number; total: number; gaps: Gap[] }> = {};

  for (const g of result.gaps) {
    if (!byFramework[g.frameworkCode])
      byFramework[g.frameworkCode] = { attested: 0, total: 0, gaps: [] };
    byFramework[g.frameworkCode].gaps.push(g);
    const layer = g.cosaiLayer ?? "UNSPECIFIED";
    if (!byLayer[layer]) byLayer[layer] = { attested: 0, total: 0, gaps: [] };
    byLayer[layer].gaps.push(g);
  }

  const fwIdsForStats = [...new Set(result.gaps.map((g) => g.frameworkId))];
  const frameworks = await loadFrameworkMetaByIds(prisma, fwIdsForStats);
  const controls = await prisma.control.findMany({
    where: { frameworkId: { in: frameworks.map((f) => f.id) } },
    select: { frameworkId: true, cosaiLayer: true }
  });
  for (const f of frameworks) {
    const total = controls.filter((c) => c.frameworkId === f.id).length;
    const gapCount = result.gaps.filter((g) => g.frameworkId === f.id).length;
    if (!byFramework[f.code]) byFramework[f.code] = { attested: 0, total: 0, gaps: [] };
    byFramework[f.code].total = total;
    byFramework[f.code].attested = total - gapCount;
  }
  for (const layer of Object.keys(byLayer)) {
    const total = Object.values(result.byLayer).reduce((s, v) => s + (v.total || 0), 0);
    const layerTotal = result.byLayer[layer]?.total ?? 0;
    byLayer[layer].total = layerTotal;
    byLayer[layer].attested = layerTotal - byLayer[layer].gaps.length;
  }

  const criticalGaps = result.gaps.filter(
    (g) => g.status === "PENDING" || g.status === "NON_COMPLIANT"
  );
  const gapsByNist80053Family: Record<string, Gap[]> = {};
  for (const g of result.gaps) {
    const fam = g.nist80053Family ?? "UNSPECIFIED";
    if (!gapsByNist80053Family[fam]) gapsByNist80053Family[fam] = [];
    gapsByNist80053Family[fam].push(g);
  }

  const recommendations = criticalGaps.length
    ? [
        `Address ${criticalGaps.length} unattested or non-compliant control(s).`,
        "Prioritize by CoSAI layer (Business → Supply Chain) for cascade alignment.",
        "Consider NIST SP 800-53 control families (e.g. SR, SC, AC) when planning compensating controls and SSP narratives."
      ]
    : ["No critical gaps. Maintain attestations and schedule next reviews."];

  return {
    byFramework,
    byLayer,
    gapsByNist80053Family,
    criticalGaps,
    recommendations
  };
}

export async function getCrossFrameworkMapping(
  prisma: PrismaClient,
  controlId: string
): Promise<RelatedControl[]> {
  const control = await prisma.control.findUnique({
    where: { id: controlId },
    select: { crossFrameworkIds: true, frameworkId: true }
  });
  if (!control?.crossFrameworkIds || !Array.isArray(control.crossFrameworkIds)) return [];

  const ids = control.crossFrameworkIds as string[];
  if (ids.length === 0) return [];

  const related = await prisma.control.findMany({
    where: { controlId: { in: ids }, id: { not: controlId } },
    select: { controlId: true, title: true, frameworkId: true }
  });
  const fwMeta = await loadFrameworkMetaByIds(
    prisma,
    [...new Set(related.map((c) => c.frameworkId))]
  );
  const fwMap = new Map(fwMeta.map((m) => [m.id, m]));
  return related.map((c) => {
    const fw = fwMap.get(c.frameworkId);
    return {
      controlId: c.controlId,
      frameworkCode: fw?.code ?? "",
      frameworkName: fw?.name ?? "",
      title: c.title
    };
  });
}
