/**
 * Assessment wizard – Step 1: asset, Step 2: frameworks, Step 3: layers, Step 4: reviewers.
 */
import Link from "next/link";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { AssessmentWizard } from "./AssessmentWizard";
import { createAssessment } from "./actions";

export default async function NewAssessmentPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const preselectedAssetId = params.assetId;

  const caller = await createServerCaller();
  const [{ data: assets }, { data: frameworks }] = await Promise.all([
    caller.assets.list({}),
    caller.compliance.getFrameworks({})
  ]);

  const verticalFirst = [...frameworks].sort((a, b) => {
    const aVert = (a.verticalApplicability as string[])?.length ?? 0;
    const bVert = (b.verticalApplicability as string[])?.length ?? 0;
    return bVert - aVert;
  });

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 px-6 py-10">
      <div>
        <Link href="/assessments" className="text-navy-400 text-sm hover:underline">
          ← Assessments
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">New Assessment</h1>
        <p className="text-slatePro-300 mt-1">Create a compliance assessment for an asset.</p>
      </div>

      <AssessmentWizard
        assets={assets}
        frameworks={verticalFirst}
        preselectedAssetId={preselectedAssetId}
        createAction={createAssessment}
      />
    </main>
  );
}
