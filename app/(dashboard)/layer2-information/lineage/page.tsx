/**
 * Data Lineage & ETL – records table and visual diagram.
 */
import { GitBranch } from "lucide-react";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { EmptyState } from "@/components/EmptyState";
import { LineageTable } from "./LineageTable";
import { AddPipelineButton } from "./AddPipelineButton";
import { LineagePageClient } from "./LineagePageClient";

const CLASSIFICATION_COLORS: Record<string, string> = {
  PUBLIC: "bg-emerald-100 text-emerald-700",
  INTERNAL: "bg-blue-100 text-blue-700",
  CONFIDENTIAL: "bg-amber-100 text-amber-700",
  RESTRICTED: "bg-red-100 text-red-700"
};

export default async function LineagePage() {
  const caller = await createServerCaller();
  const [{ data: records }, { data: diagramData }] = await Promise.all([
    caller.layer2.getLineageRecords(),
    caller.layer2.getLineageDiagramData()
  ]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Data Lineage & ETL
          </h1>
          <p className="mt-1 text-slate-600">
            Pipeline records and visual lineage from master data to AI assets.
          </p>
        </div>
        <AddPipelineButton />
      </div>

      {records.length === 0 && diagramData.lineage.length === 0 ? (
        <EmptyState
          title="No lineage records"
          description="No lineage records yet — add a pipeline to see data flow visualization."
          ctaLabel="Add Pipeline"
          ctaHref="/layer2-information/lineage/new"
          icon={<GitBranch className="h-8 w-8" />}
        />
      ) : (
        <>
          <LineageTable records={records} classificationColors={CLASSIFICATION_COLORS} />

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Lineage Diagram</h2>
            <LineagePageClient diagramData={diagramData} />
          </div>
        </>
      )}
    </main>
  );
}
