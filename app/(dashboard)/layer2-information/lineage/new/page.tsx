/**
 * Add Pipeline – form for new lineage record.
 */
import Link from "next/link";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { AddPipelineForm } from "../AddPipelineForm";

export default async function NewLineagePage() {
  const caller = await createServerCaller();
  const [entitiesRes, assetsRes] = await Promise.all([
    caller.layer2.getMasterDataEntities({}),
    caller.assets.list({})
  ]);
  const entities = entitiesRes.data;
  const assets = assetsRes.data;

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 px-6 py-10">
      <div>
        <Link href="/layer2-information/lineage" className="text-sm text-navy-600 hover:underline">
          ← Back to Data Lineage
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Add Pipeline</h1>
        <p className="mt-1 text-slate-600">
          Register a new data pipeline from master data to AI asset.
        </p>
      </div>

      <AddPipelineForm entities={entities} assets={assets} />
    </main>
  );
}
