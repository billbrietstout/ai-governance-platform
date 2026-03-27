/**
 * One demonstrable L1→L5 parent chain for EU AI Act (impact tree UI).
 */
import type { CosaiLayer, PrismaClient } from "@prisma/client";

const LAYERS: CosaiLayer[] = [
  "LAYER_1_BUSINESS",
  "LAYER_2_INFORMATION",
  "LAYER_3_APPLICATION",
  "LAYER_4_PLATFORM",
  "LAYER_5_SUPPLY_CHAIN"
];

export async function seedRegulationCascadeChain(prisma: PrismaClient, orgId: string) {
  const fw = await prisma.complianceFramework.findFirst({
    where: { orgId, code: "EU_AI_ACT", isActive: true }
  });
  if (!fw) return;

  const existing = await prisma.control.findFirst({
    where: { frameworkId: fw.id, parentControlId: { not: null } }
  });
  if (existing) return;

  const all = await prisma.control.findMany({
    where: { frameworkId: fw.id },
    orderBy: { controlId: "asc" }
  });

  const grouped = new Map<CosaiLayer, typeof all>();
  for (const layer of LAYERS) {
    grouped.set(
      layer,
      all.filter((c) => c.cosaiLayer === layer)
    );
  }

  const l1 = grouped.get("LAYER_1_BUSINESS")?.[0];
  const l2 = grouped.get("LAYER_2_INFORMATION")?.slice(0, 3);
  const l3 = grouped.get("LAYER_3_APPLICATION")?.slice(0, 2);
  const l4 = grouped.get("LAYER_4_PLATFORM")?.slice(0, 2);
  const l5 = grouped.get("LAYER_5_SUPPLY_CHAIN")?.slice(0, 2);

  if (!l1 || !l2 || l2.length < 2 || !l3 || l3.length < 2 || !l4 || l4.length < 2 || !l5 || l5.length < 2) {
    return;
  }

  await prisma.control.update({
    where: { id: l2[0].id },
    data: {
      parentControlId: l1.id,
      layerImpactSummary: "L2: information-layer controls implement the L1 business obligation."
    }
  });
  await prisma.control.update({
    where: { id: l2[1].id },
    data: {
      parentControlId: l1.id,
      layerImpactSummary: "L2: secondary data control under the same L1 root."
    }
  });

  await prisma.control.update({
    where: { id: l3[0].id },
    data: {
      parentControlId: l2[0].id,
      layerImpactSummary: "L3: AI asset implements required application controls."
    }
  });
  await prisma.control.update({
    where: { id: l3[1].id },
    data: {
      parentControlId: l2[0].id,
      layerImpactSummary: "L3: paired application control."
    }
  });

  await prisma.control.update({
    where: { id: l4[0].id },
    data: {
      parentControlId: l3[0].id,
      layerImpactSummary: "L4: platform telemetry and operations evidence."
    }
  });
  await prisma.control.update({
    where: { id: l4[1].id },
    data: {
      parentControlId: l3[0].id,
      layerImpactSummary: "L4: secondary platform control."
    }
  });

  await prisma.control.update({
    where: { id: l5[0].id },
    data: {
      parentControlId: l4[0].id,
      layerImpactSummary: "L5: vendor assessment aligns with platform controls."
    }
  });
  await prisma.control.update({
    where: { id: l5[1].id },
    data: {
      parentControlId: l4[0].id,
      layerImpactSummary: "L5: additional vendor checkpoint."
    }
  });
}
