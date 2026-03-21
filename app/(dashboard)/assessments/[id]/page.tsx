/**
 * Assessment workflow – controls grouped by cosaiLayer, attestation per control.
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { prisma } from "@/lib/prisma";
import { AssessmentWorkflow } from "./AssessmentWorkflow";

export default async function AssessmentDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const caller = await createServerCaller();
  const { data: assessment } = await caller.assessment.get({ id });

  if (!assessment) notFound();
  const assetId = assessment.assetId;
  const frameworkIds = assessment.frameworkIds as string[];
  const layersInScope = assessment.layersInScope as string[];

  const controls = await prisma.control.findMany({
    where: {
      frameworkId: { in: frameworkIds },
      ...(layersInScope.length > 0
        ? {
            cosaiLayer: {
              in: layersInScope as (
                | "LAYER_1_BUSINESS"
                | "LAYER_2_INFORMATION"
                | "LAYER_3_APPLICATION"
                | "LAYER_4_PLATFORM"
                | "LAYER_5_SUPPLY_CHAIN"
              )[]
            }
          }
        : {})
    },
    include: { framework: { select: { code: true, name: true } } },
    orderBy: [{ cosaiLayer: "asc" }, { controlId: "asc" }]
  });

  const attestations = await prisma.controlAttestation.findMany({
    where: { assetId, controlId: { in: controls.map((c) => c.id) } }
  });
  const attMap = new Map(attestations.map((a) => [a.controlId, a]));

  const controlsWithAtt = controls.map((c) => ({
    ...c,
    attestation: attMap.get(c.id)
  }));

  const byLayer = new Map<string, typeof controlsWithAtt>();
  for (const c of controlsWithAtt) {
    const layer = c.cosaiLayer ?? "UNSPECIFIED";
    const list = byLayer.get(layer) ?? [];
    list.push(c);
    byLayer.set(layer, list);
  }

  const layerOrder = [
    "LAYER_1_BUSINESS",
    "LAYER_2_INFORMATION",
    "LAYER_3_APPLICATION",
    "LAYER_4_PLATFORM",
    "LAYER_5_SUPPLY_CHAIN",
    "UNSPECIFIED"
  ];
  const layers = layerOrder.filter((l) => byLayer.has(l));

  return (
    <main className="mx-auto flex min-h-dvh max-w-5xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/assessments" className="text-navy-400 text-sm hover:underline">
            ← Assessments
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">{assessment.name}</h1>
          <p className="mt-1 text-gray-600">
            {assessment.asset.name} · {assessment.status}
          </p>
        </div>
        <div className="flex gap-2">
          {assessment.status === "DRAFT" && <SubmitForReviewButton assessmentId={id} />}
          {assessment.status === "PENDING_REVIEW" && <ApproveButton assessmentId={id} />}
        </div>
      </div>

      <AssessmentWorkflow
        assessmentId={id}
        assetId={assetId}
        layers={layers}
        byLayer={Object.fromEntries(byLayer)}
        status={assessment.status}
      />
    </main>
  );
}

async function SubmitForReviewButton({ assessmentId }: { assessmentId: string }) {
  return (
    <form action={submitForReview.bind(null, assessmentId)}>
      <button
        type="submit"
        className="rounded bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-500"
      >
        Submit for Review
      </button>
    </form>
  );
}

async function submitForReview(assessmentId: string) {
  "use server";
  const { createServerCaller } = await import("@/lib/trpc/server-caller");
  const caller = await createServerCaller();
  await caller.assessment.updateStatus({ id: assessmentId, status: "PENDING_REVIEW" });
  const { revalidatePath } = await import("next/cache");
  revalidatePath(`/assessments/${assessmentId}`);
}

async function ApproveButton({ assessmentId }: { assessmentId: string }) {
  return (
    <form action={approve.bind(null, assessmentId)}>
      <button
        type="submit"
        className="rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500"
      >
        Approve
      </button>
    </form>
  );
}

async function approve(assessmentId: string) {
  "use server";
  const { createServerCaller } = await import("@/lib/trpc/server-caller");
  const caller = await createServerCaller();
  await caller.assessment.updateStatus({ id: assessmentId, status: "APPROVED" });
  const { revalidatePath } = await import("next/cache");
  revalidatePath(`/assessments/${assessmentId}`);
}
