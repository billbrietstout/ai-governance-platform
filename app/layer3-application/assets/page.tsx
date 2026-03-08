/**
 * AI Asset Inventory – filterable asset table.
 */
import Link from "next/link";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { EURiskBadge } from "@/components/assets/EURiskBadge";
import { AutonomyBadge } from "@/components/assets/AutonomyBadge";
import { OperatingModelBadge } from "@/components/assets/OperatingModelBadge";
import { ComplianceRing } from "@/components/assets/ComplianceRing";
import { EmptyState } from "@/components/EmptyState";
import { AssetFilters } from "./AssetFilters";

export default async function AssetsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const caller = await createServerCaller();
  const { data } = await caller.assets.list({
    assetType: params.type as "MODEL" | "PROMPT" | "AGENT" | "DATASET" | "APPLICATION" | "TOOL" | "PIPELINE" | undefined,
    euRiskLevel: params.euRisk as "MINIMAL" | "LIMITED" | "HIGH" | "UNACCEPTABLE" | undefined,
    cosaiLayer: params.layer as "LAYER_1_BUSINESS" | "LAYER_2_INFORMATION" | "LAYER_3_APPLICATION" | "LAYER_4_PLATFORM" | "LAYER_5_SUPPLY_CHAIN" | undefined,
    verticalMarket: params.vertical as "GENERAL" | "HEALTHCARE" | "FINANCIAL" | "AUTOMOTIVE" | "RETAIL" | "MANUFACTURING" | "PUBLIC_SECTOR" | undefined,
    operatingModel: params.operatingModel as "IN_HOUSE" | "VENDOR" | "HYBRID" | undefined,
    status: params.status as "DRAFT" | "ACTIVE" | "DEPRECATED" | "ARCHIVED" | undefined
  });

  const byEuRisk = data.reduce(
    (acc, a) => {
      const k = a.euRiskLevel ?? "UNSET";
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  const byAutonomy = data.reduce(
    (acc, a) => {
      const k = a.autonomyLevel ?? "UNSET";
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Asset Inventory</h1>
          <p className="mt-1 text-slatePro-300">Filterable asset table with compliance metrics.</p>
        </div>
        <Link
          href="/layer3-application/assets/new"
          className="rounded bg-navy-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-navy-500"
        >
          New Asset
        </Link>
      </div>

      <div className="flex flex-wrap gap-4 rounded-lg border border-slatePro-700 bg-slatePro-900/30 px-4 py-3">
        <div className="text-sm font-medium text-slatePro-400">
          Total: <span className="text-slatePro-100">{data.length}</span>
        </div>
        <div className="border-l border-slatePro-700 pl-4">
          <span className="text-xs text-slatePro-500">By EU risk: </span>
          {Object.entries(byEuRisk).map(([k, v]) => (
            <span key={k} className="ml-2 text-sm text-slatePro-300">
              {k === "UNSET" ? "—" : k}: {v}
            </span>
          ))}
        </div>
        <div className="border-l border-slatePro-700 pl-4">
          <span className="text-xs text-slatePro-500">By autonomy: </span>
          {Object.entries(byAutonomy).map(([k, v]) => (
            <span key={k} className="ml-2 text-sm text-slatePro-300">
              {k === "UNSET" ? "—" : k.replace(/_/g, " ")}: {v}
            </span>
          ))}
        </div>
      </div>

      <AssetFilters />

      <div className="overflow-x-auto rounded-lg border border-slatePro-700">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slatePro-700 bg-slatePro-900/50">
              <th className="px-4 py-2 text-left font-medium text-slatePro-300">Name</th>
              <th className="px-4 py-2 text-left font-medium text-slatePro-300">Type</th>
              <th className="px-4 py-2 text-left font-medium text-slatePro-300">EU Risk</th>
              <th className="px-4 py-2 text-left font-medium text-slatePro-300">Operating</th>
              <th className="px-4 py-2 text-left font-medium text-slatePro-300">Autonomy</th>
              <th className="px-4 py-2 text-left font-medium text-slatePro-300">Status</th>
              <th className="px-4 py-2 text-left font-medium text-slatePro-300">Owner</th>
              <th className="px-4 py-2 text-left font-medium text-slatePro-300">Compliance</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-0">
                  <div className="p-6">
                    <EmptyState
                      title="No assets yet"
                      description="Add your first AI asset to start tracking compliance and risk."
                      ctaLabel="New Asset"
                      ctaHref="/layer3-application/assets/new"
                    />
                  </div>
                </td>
              </tr>
            ) : (
              data.map((a) => (
                <tr key={a.id} className="border-b border-slatePro-800 last:border-0">
                  <td className="px-4 py-2">
                    <Link href={`/layer3-application/assets/${a.id}`} className="font-medium text-navy-400 hover:underline">
                      {a.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-slatePro-200">{a.assetType}</td>
                  <td className="px-4 py-2">
                    <EURiskBadge level={a.euRiskLevel} />
                  </td>
                  <td className="px-4 py-2">
                    <OperatingModelBadge model={a.operatingModel} />
                  </td>
                  <td className="px-4 py-2">
                    <AutonomyBadge level={a.autonomyLevel} />
                  </td>
                  <td className="px-4 py-2 text-slatePro-200">{a.status}</td>
                  <td className="px-4 py-2 text-slatePro-200">{a.owner?.email ?? "—"}</td>
                  <td className="px-4 py-2">
                    <ComplianceRing percentage={(a as { compliancePercentage?: number }).compliancePercentage ?? 0} size={32} strokeWidth={3} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
