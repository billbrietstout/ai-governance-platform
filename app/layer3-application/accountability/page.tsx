/**
 * Cross-asset RACI matrix – filter by cosaiLayer, gaps highlighted.
 */
import Link from "next/link";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { AccountabilityMatrix } from "@/components/assets/AccountabilityMatrix";
import { AccountabilityFilters } from "./AccountabilityFilters";

const COSAI_LAYERS = [
  "LAYER_1_BUSINESS",
  "LAYER_2_INFORMATION",
  "LAYER_3_APPLICATION",
  "LAYER_4_PLATFORM",
  "LAYER_5_SUPPLY_CHAIN"
];

export default async function AccountabilityPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const layer = params.layer;
  const caller = await createServerCaller();
  const { data } = await caller.accountability.getCrossAssetMatrix({
    cosaiLayer: layer
  });

  const layersToShow = layer ? [layer] : COSAI_LAYERS;
  const allAssignments = data.assignments;

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Accountability Matrix</h1>
        <p className="mt-1 text-slatePro-300">
          Cross-asset RACI matrix. Filter by CoSAI layer to see ownership at each layer.
        </p>
      </div>

      <AccountabilityFilters />

      {data.gaps.length > 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
          <h2 className="text-sm font-medium text-amber-400">Gaps — components without accountable party</h2>
          <ul className="mt-2 space-y-1">
            {data.gaps.map((g) => (
              <li key={g.assetId}>
                <Link href={`/layer3-application/assets/${g.assetId}`} className="text-navy-400 hover:underline">
                  {g.assetName}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-6">
        {data.assets.map((asset) => {
          const assignments = data.byAsset[asset.id] ?? [];
          const filtered = layer ? assignments.filter((a) => a.cosaiLayer === layer) : assignments;
          const showLayers = layer ? [layer] : [...new Set(assignments.map((a) => a.cosaiLayer))];
          if (filtered.length === 0 && !layer) return null;
          return (
            <div key={asset.id} className="rounded-lg border border-slatePro-700 bg-slatePro-900/30 p-4">
              <h2 className="mb-2 font-medium text-slatePro-200">
                <Link href={`/layer3-application/assets/${asset.id}`} className="text-navy-400 hover:underline">
                  {asset.name}
                </Link>
              </h2>
              {filtered.length === 0 ? (
                <p className="text-amber-400 text-sm">No assignments for this layer</p>
              ) : (
                <AccountabilityMatrix
                  assignments={filtered.map((a) => ({
                    ...a,
                    supportingParties: Array.isArray(a.supportingParties) ? (a.supportingParties as string[]) : undefined
                  }))}
                  layers={showLayers}
                />
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
