/**
 * Vertical cascade – controls by vertical/layer, regulation flow, regulation map.
 */
import type { PrismaClient } from "@prisma/client";

import {
  loadActiveFrameworksWithControlCount,
  loadFrameworkMetaByIds
} from "@/lib/compliance/framework-queries";

const COSAI_LAYER_ORDER = [
  "LAYER_1_BUSINESS",
  "LAYER_2_INFORMATION",
  "LAYER_3_APPLICATION",
  "LAYER_4_PLATFORM",
  "LAYER_5_SUPPLY_CHAIN"
] as const;

export type ControlSummary = {
  id: string;
  controlId: string;
  title: string;
  frameworkCode: string;
  cosaiLayer: string | null;
};

export type CascadeChain = {
  regulation: string;
  fromLayer: string;
  toLayer: string;
  steps: { layer: string; controls: ControlSummary[] }[];
};

export type RegulationMap = {
  frameworks: { id: string; code: string; name: string; controlCount: number }[];
  byLayer: Record<string, ControlSummary[]>;
};

/**
 * Get controls applicable to a vertical and optionally filtered by CoSAI layer.
 * Uses orgId for tenant scope.
 */
export async function getVerticalControls(
  prisma: PrismaClient,
  orgId: string,
  vertical: string,
  cosaiLayer: string | null
): Promise<ControlSummary[]> {
  const orgFwRows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM "ComplianceFramework" WHERE "orgId" = ${orgId} AND "isActive" = true
  `;
  const orgFwIds = orgFwRows.map((r) => r.id);
  if (orgFwIds.length === 0) return [];

  const controls = await prisma.control.findMany({
    where: {
      frameworkId: { in: orgFwIds },
      ...(cosaiLayer
        ? {
            cosaiLayer: cosaiLayer as
              | "LAYER_1_BUSINESS"
              | "LAYER_2_INFORMATION"
              | "LAYER_3_APPLICATION"
              | "LAYER_4_PLATFORM"
              | "LAYER_5_SUPPLY_CHAIN"
          }
        : {})
    }
  });

  const meta = await loadFrameworkMetaByIds(
    prisma,
    [...new Set(controls.map((c) => c.frameworkId))]
  );
  const fwCode = new Map(meta.map((m) => [m.id, m.code]));

  const filtered = vertical
    ? controls.filter((c) => {
        const v = c.verticalApplicability as string[] | null;
        return !v || v.length === 0 || v.includes(vertical);
      })
    : controls;

  return filtered.map((c) => ({
    id: c.id,
    controlId: c.controlId,
    title: c.title,
    frameworkCode: fwCode.get(c.frameworkId) ?? "",
    cosaiLayer: c.cosaiLayer
  }));
}

export async function getCascadeChain(
  prisma: PrismaClient,
  orgId: string,
  regulation: string,
  fromLayer: string,
  toLayer: string
): Promise<CascadeChain> {
  const fromIdx = COSAI_LAYER_ORDER.indexOf(fromLayer as (typeof COSAI_LAYER_ORDER)[number]);
  const toIdx = COSAI_LAYER_ORDER.indexOf(toLayer as (typeof COSAI_LAYER_ORDER)[number]);
  const start = Math.min(
    fromIdx >= 0 ? fromIdx : 0,
    toIdx >= 0 ? toIdx : COSAI_LAYER_ORDER.length - 1
  );
  const end = Math.max(
    fromIdx >= 0 ? fromIdx : 0,
    toIdx >= 0 ? toIdx : COSAI_LAYER_ORDER.length - 1
  );
  const layersInRange = COSAI_LAYER_ORDER.slice(Math.min(start, end), Math.max(start, end) + 1);

  const frameworks = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM "ComplianceFramework"
    WHERE "orgId" = ${orgId} AND "isActive" = true AND code::text = ${regulation}
  `;
  if (frameworks.length === 0) {
    return { regulation, fromLayer, toLayer, steps: [] };
  }

  const fwIds = frameworks.map((f) => f.id);
  const controls = await prisma.control.findMany({
    where: { frameworkId: { in: fwIds } }
  });
  const meta = await loadFrameworkMetaByIds(prisma, [...new Set(controls.map((c) => c.frameworkId))]);
  const fwCode = new Map(meta.map((m) => [m.id, m.code]));

  const steps = layersInRange.map((layer) => {
    const layerControls = controls.filter((c) => c.cosaiLayer === layer);
    return {
      layer,
      controls: layerControls.map((c) => ({
        id: c.id,
        controlId: c.controlId,
        title: c.title,
        frameworkCode: fwCode.get(c.frameworkId) ?? "",
        cosaiLayer: c.cosaiLayer
      }))
    };
  });

  return { regulation, fromLayer, toLayer, steps };
}

export async function getRegulationMap(
  prisma: PrismaClient,
  orgId: string
): Promise<RegulationMap> {
  const frameworks = await loadActiveFrameworksWithControlCount(prisma, orgId);
  const fwIds = frameworks.map((f) => f.id);
  if (fwIds.length === 0) {
    return { frameworks: [], byLayer: {} };
  }

  const controls = await prisma.control.findMany({
    where: { frameworkId: { in: fwIds } }
  });

  const meta = await loadFrameworkMetaByIds(prisma, [...new Set(controls.map((c) => c.frameworkId))]);
  const fwCode = new Map(meta.map((m) => [m.id, m.code]));

  const mapControl = (c: (typeof controls)[number]): ControlSummary => ({
    id: c.id,
    controlId: c.controlId,
    title: c.title,
    frameworkCode: fwCode.get(c.frameworkId) ?? "",
    cosaiLayer: c.cosaiLayer
  });

  const byLayer: Record<string, ControlSummary[]> = {};
  for (const layer of COSAI_LAYER_ORDER) {
    byLayer[layer] = controls.filter((c) => c.cosaiLayer === layer).map(mapControl);
  }
  byLayer.UNSPECIFIED = controls.filter((c) => !c.cosaiLayer).map(mapControl);

  return {
    frameworks: frameworks.map((f) => ({
      id: f.id,
      code: f.code,
      name: f.name,
      controlCount: f.controlCount
    })),
    byLayer
  };
}
