/**
 * lib/compliance/bulk-engine.ts
 * Bulk compliance scoring for dashboard — replaces per-asset sequential queries.
 * Single DB round-trip instead of 4 queries × N assets.
 */
import type { PrismaClient } from "@prisma/client";

export type BulkLayerPosture = {
  layer: string;
  compliancePct: number;
  riskCount: number;
  accountableOwner: string | null;
  lastReviewed: Date | null;
};

export type BulkHeatmapRow = {
  framework: string;
  [assetType: string]: string | number;
};

const COSAI_LAYERS = [
  "LAYER_1_BUSINESS",
  "LAYER_2_INFORMATION",
  "LAYER_3_APPLICATION",
  "LAYER_4_PLATFORM",
  "LAYER_5_SUPPLY_CHAIN",
] as const;

/**
 * Bulk layer posture — replaces the sequential per-asset loop in getCachedLayerPosture.
 * 5 queries total regardless of asset count.
 */
export async function getBulkLayerPosture(
  prisma: PrismaClient,
  orgId: string
): Promise<BulkLayerPosture[]> {
  // Single bulk fetch of everything needed
  const [assets, frameworks, assignments, risks] = await Promise.all([
    prisma.aIAsset.findMany({
      where: { orgId, deletedAt: null },
      select: { id: true, cosaiLayer: true },
    }),
    prisma.complianceFramework.findMany({
      where: { orgId, isActive: true },
      select: { id: true },
    }),
    prisma.accountabilityAssignment.findMany({
      where: { asset: { orgId, deletedAt: null } },
      select: { cosaiLayer: true, accountableParty: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.riskRegister.groupBy({
      by: ["cosaiLayer"],
      where: { orgId, deletedAt: null, cosaiLayer: { not: null } },
      _count: { id: true },
    }),
  ]);

  if (assets.length === 0 || frameworks.length === 0) {
    return COSAI_LAYERS.map((layer) => ({
      layer,
      compliancePct: 0,
      riskCount: 0,
      accountableOwner: null,
      lastReviewed: null,
    }));
  }

  const assetIds = assets.map((a) => a.id);
  const frameworkIds = frameworks.map((f) => f.id);

  // Bulk fetch controls and attestations in 2 queries
  const [controls, attestations] = await Promise.all([
    prisma.control.findMany({
      where: { frameworkId: { in: frameworkIds } },
      select: { id: true, cosaiLayer: true, frameworkId: true },
    }),
  ]);

  // Fetch attestations with correct control IDs
  const controlIds = controls.map((c) => c.id);
  const bulkAttestations = await prisma.controlAttestation.findMany({
    where: {
      assetId: { in: assetIds },
      controlId: { in: controlIds },
      status: { in: ["COMPLIANT", "NOT_APPLICABLE"] },
    },
    select: { assetId: true, controlId: true },
  });

  // Build lookup: assetId+controlId → attested
  const attestedSet = new Set(bulkAttestations.map((a) => `${a.assetId}:${a.controlId}`));

  // Build risk count lookup
  const riskCountByLayer = new Map(
    risks.map((r) => [r.cosaiLayer!, r._count.id])
  );

  // Build accountability lookup (first assignment per layer)
  const assignmentByLayer = new Map<string, { accountableParty: string | null; updatedAt: Date }>();
  for (const a of assignments) {
    if (a.cosaiLayer && !assignmentByLayer.has(a.cosaiLayer)) {
      assignmentByLayer.set(a.cosaiLayer, {
        accountableParty: a.accountableParty,
        updatedAt: a.updatedAt,
      });
    }
  }

  // Compute layer scores in memory — no more DB calls
  // Logic: for each layer, score = attested controls / total controls
  // where controls are counted per asset in that layer (all controls, grouped by cosaiLayer)
  return COSAI_LAYERS.map((layer) => {
    const layerAssets = assets.filter((a) => a.cosaiLayer === layer);
    const assignment = assignmentByLayer.get(layer);

    if (layerAssets.length === 0) {
      return {
        layer,
        compliancePct: 0,
        riskCount: riskCountByLayer.get(layer) ?? 0,
        accountableOwner: assignment?.accountableParty ?? null,
        lastReviewed: assignment?.updatedAt ?? null,
      };
    }

    // Count total controls and attested controls across all assets in this layer
    // Use all controls (regardless of cosaiLayer on control) — matches original engine behavior
    let totalControls = 0;
    let attestedControls = 0;

    for (const asset of layerAssets) {
      for (const control of controls) {
        totalControls++;
        if (attestedSet.has(`${asset.id}:${control.id}`)) {
          attestedControls++;
        }
      }
    }

    return {
      layer,
      compliancePct: totalControls > 0 ? Math.round((attestedControls / totalControls) * 100) : 0,
      riskCount: riskCountByLayer.get(layer) ?? 0,
      accountableOwner: assignment?.accountableParty ?? null,
      lastReviewed: assignment?.updatedAt ?? null,
    };
  });
}

/**
 * Bulk compliance heatmap — replaces per-asset per-framework loop.
 * 4 queries total regardless of asset/framework count.
 */
export async function getBulkComplianceHeatmap(
  prisma: PrismaClient,
  orgId: string
): Promise<BulkHeatmapRow[]> {
  const [frameworks, assets] = await Promise.all([
    prisma.complianceFramework.findMany({
      where: { orgId, isActive: true },
      select: { id: true, code: true },
    }),
    prisma.aIAsset.findMany({
      where: { orgId, deletedAt: null },
      select: { id: true, assetType: true },
    }),
  ]);

  if (frameworks.length === 0 || assets.length === 0) return [];

  const assetIds = assets.map((a) => a.id);
  const frameworkIds = frameworks.map((f) => f.id);

  const [controls, attestations] = await Promise.all([
    prisma.control.findMany({
      where: { frameworkId: { in: frameworkIds } },
      select: { id: true, frameworkId: true },
    }),
    prisma.controlAttestation.findMany({
      where: {
        assetId: { in: assetIds },
        status: { in: ["COMPLIANT", "NOT_APPLICABLE"] },
      },
      select: { assetId: true, controlId: true },
    }),
  ]);

  // Build lookups
  const controlFrameworkMap = new Map(controls.map((c) => [c.id, c.frameworkId]));
  const assetTypeMap = new Map(assets.map((a) => [a.id, a.assetType]));
  const attestedSet = new Set(attestations.map((a) => `${a.assetId}:${a.controlId}`));

  // Compute heatmap in memory
  return frameworks.map((fw) => {
    const row: BulkHeatmapRow = { framework: fw.code };
    const fwControls = controls.filter((c) => c.frameworkId === fw.id);

    // Group assets by type
    const byType: Record<string, { attested: number; total: number }> = {};
    for (const asset of assets) {
      const type = assetTypeMap.get(asset.id) ?? "UNKNOWN";
      if (!byType[type]) byType[type] = { attested: 0, total: 0 };
      for (const control of fwControls) {
        byType[type].total++;
        if (attestedSet.has(`${asset.id}:${control.id}`)) {
          byType[type].attested++;
        }
      }
    }

    for (const [type, { attested, total }] of Object.entries(byType)) {
      row[type] = total > 0 ? Math.round((attested / total) * 100) : 0;
    }

    return row;
  });
}
