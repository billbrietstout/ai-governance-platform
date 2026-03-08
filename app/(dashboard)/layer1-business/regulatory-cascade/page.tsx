/**
 * Regulatory Cascade – regulation flow through CoSAI layers.
 * Key demo differentiator – polished view.
 */
import Link from "next/link";
import { auth } from "@/auth";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { prisma } from "@/lib/prisma";
import * as engine from "@/lib/compliance/engine";
import { RegulationCascadeView } from "./RegulationCascadeView";

const REGULATIONS = [
  { id: "EU_AI_ACT", name: "EU AI Act", code: "EU_AI_ACT" },
  { id: "NIST_AI_RMF", name: "NIST AI RMF", code: "NIST_AI_RMF" },
  { id: "COSAI_SRF", name: "CoSAI SRF", code: "COSAI_SRF" },
  { id: "NIST_CSF", name: "NIST CSF", code: "NIST_CSF" }
];

const COSAI_LAYERS = [
  "LAYER_1_BUSINESS",
  "LAYER_2_INFORMATION",
  "LAYER_3_APPLICATION",
  "LAYER_4_PLATFORM",
  "LAYER_5_SUPPLY_CHAIN"
];

export default async function RegulatoryCascadePage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const regulation = params.regulation ?? "EU_AI_ACT";
  const session = await auth();
  const orgId = (session?.user as { orgId?: string })?.orgId;

  const caller = await createServerCaller();
  const { data: map } = await caller.compliance.getRegulationMap({});

  const framework = map.frameworks.find((f) => f.code === regulation);
  const frameworkId = framework?.id;

  const cascadeSteps: { layer: string; controls: { id: string; controlId: string; title: string; frameworkCode: string }[] }[] = [];
  const unmetByLayer: Record<string, { controlId: string; title: string; owner: string; assetId: string; assetName: string }[]> = {};

  if (frameworkId && orgId) {
    const controls = await prisma.control.findMany({
      where: { frameworkId },
      include: { framework: { select: { code: true } } },
      orderBy: [{ cosaiLayer: "asc" }, { controlId: "asc" }]
    });

    for (const layer of COSAI_LAYERS) {
      const layerControls = controls.filter((c) => c.cosaiLayer === layer);
      cascadeSteps.push({
        layer,
        controls: layerControls.map((c) => ({
          id: c.id,
          controlId: c.controlId,
          title: c.title,
          frameworkCode: c.framework.code
        }))
      });
    }

    const orgAssets = await prisma.aIAsset.findMany({
      where: { orgId, deletedAt: null },
      select: { id: true, name: true }
    });

    for (const layer of COSAI_LAYERS) {
      const gaps: { controlId: string; title: string; owner: string; assetId: string; assetName: string }[] = [];

      for (const asset of orgAssets) {
        const report = await engine.getGapAnalysis(prisma, asset.id);
        for (const g of report.criticalGaps) {
          if (g.frameworkId === frameworkId && g.cosaiLayer === layer) {
            const assignment = await prisma.accountabilityAssignment.findFirst({
              where: { assetId: asset.id, cosaiLayer: layer as "LAYER_1_BUSINESS" | "LAYER_2_INFORMATION" | "LAYER_3_APPLICATION" | "LAYER_4_PLATFORM" | "LAYER_5_SUPPLY_CHAIN" }
            });
            gaps.push({
              controlId: g.controlId,
              title: g.title,
              owner: assignment?.accountableParty ?? "Unassigned",
              assetId: asset.id,
              assetName: asset.name
            });
          }
        }
      }
      if (gaps.length > 0) unmetByLayer[layer] = gaps;
    }
  }

  const regName = REGULATIONS.find((r) => r.code === regulation)?.name ?? regulation;

  if (!frameworkId) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-5xl flex-col gap-6 px-6 py-10">
        <div>
          <Link href="/layer1-business" className="text-sm text-navy-400 hover:underline">
            ← Layer 1: Business
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Regulatory Cascade</h1>
        </div>
        <p className="rounded-lg border border-slatePro-700 bg-slatePro-900/30 p-4 text-slatePro-400">
          {regName} framework not configured for this organization. Seed compliance frameworks to enable this view.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-5xl flex-col gap-6 px-6 py-10">
      <div>
        <Link href="/layer1-business" className="text-sm text-navy-400 hover:underline">
          ← Layer 1: Business
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Regulatory Cascade</h1>
        <p className="mt-1 text-slatePro-300">
          How {regName} flows through CoSAI layers. Controls at each layer. Unmet requirements with owner and remediation.
        </p>
      </div>

      <div className="flex gap-2">
        {REGULATIONS.map((r) => (
          <Link
            key={r.id}
            href={`/layer1-business/regulatory-cascade?regulation=${r.code}`}
            className={`rounded px-3 py-1.5 text-sm font-medium ${
              regulation === r.code ? "bg-navy-600 text-white" : "bg-slatePro-800 text-slatePro-300 hover:bg-slatePro-700"
            }`}
          >
            {r.name}
          </Link>
        ))}
      </div>

      <RegulationCascadeView
        regulation={regName}
        steps={cascadeSteps}
        unmetByLayer={unmetByLayer}
      />
    </main>
  );
}
