/**
 * AI Asset Inventory – card/table hybrid with compliance metrics.
 */
import Link from "next/link";
import { auth } from "@/auth";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { prisma } from "@/lib/prisma";
import { orgVerticalToKey } from "@/lib/vertical-regulations";
import { EURiskBadge } from "@/components/assets/EURiskBadge";
import { AutonomyBadge } from "@/components/assets/AutonomyBadge";
import { ComplianceRing } from "@/components/assets/ComplianceRing";
import { AssetTypeIcon } from "@/components/assets/AssetTypeIcon";
import { VerticalRegulationBadge } from "@/components/assets/VerticalRegulationBadge";
import { EmptyState } from "@/components/EmptyState";
import { AssetFilters } from "./AssetFilters";

export default async function AssetsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const caller = await createServerCaller();
  const [assetsRes, org] = await Promise.all([
    caller.assets.list({
      assetType: params.type as
        | "MODEL"
        | "PROMPT"
        | "AGENT"
        | "DATASET"
        | "APPLICATION"
        | "TOOL"
        | "PIPELINE"
        | undefined,
      euRiskLevel: params.euRisk as "MINIMAL" | "LIMITED" | "HIGH" | "UNACCEPTABLE" | undefined,
      cosaiLayer: params.layer as
        | "LAYER_1_BUSINESS"
        | "LAYER_2_INFORMATION"
        | "LAYER_3_APPLICATION"
        | "LAYER_4_PLATFORM"
        | "LAYER_5_SUPPLY_CHAIN"
        | undefined,
      verticalMarket: params.vertical as
        | "GENERAL"
        | "HEALTHCARE"
        | "FINANCIAL"
        | "INSURANCE"
        | "AUTOMOTIVE"
        | "RETAIL"
        | "MANUFACTURING"
        | "PUBLIC_SECTOR"
        | "ENERGY"
        | undefined,
      operatingModel: params.operatingModel as "IN_HOUSE" | "VENDOR" | "HYBRID" | undefined,
      status: params.status as "DRAFT" | "ACTIVE" | "DEPRECATED" | "ARCHIVED" | undefined
    }),
    (async () => {
      const session = await auth();
      const orgId = (session?.user as { orgId?: string })?.orgId;
      if (!orgId) return null;
      return prisma.organization.findUnique({
        where: { id: orgId },
        select: { verticalMarket: true }
      });
    })()
  ]);

  const { data } = assetsRes;
  const verticalKey = orgVerticalToKey(org?.verticalMarket ?? null);

  const byEuRisk = data.reduce(
    (acc, a) => {
      const k = a.euRiskLevel ?? "UNSET";
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const riskPillColors: Record<string, string> = {
    MINIMAL: "bg-emerald-100 text-emerald-700",
    LIMITED: "bg-amber-100 text-amber-700",
    HIGH: "bg-orange-100 text-orange-700",
    UNACCEPTABLE: "bg-red-100 text-red-700",
    UNSET: "bg-gray-100 text-gray-500"
  };

  const riskLabels: Record<string, string> = {
    MINIMAL: "Minimal",
    LIMITED: "Limited",
    HIGH: "High",
    UNACCEPTABLE: "Unacceptable",
    UNSET: "Unset"
  };

  const assetTypeLabels: Record<string, string> = {
    MODEL: "Model",
    PROMPT: "Prompt",
    AGENT: "Agent",
    DATASET: "Dataset",
    APPLICATION: "Application",
    TOOL: "Tool",
    PIPELINE: "Pipeline"
  };

  const statusLabels: Record<string, string> = {
    DRAFT: "Draft",
    ACTIVE: "Active",
    DEPRECATED: "Deprecated",
    ARCHIVED: "Archived"
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Asset Inventory</h1>
          <p className="mt-1 text-slate-600">Filterable asset table with compliance metrics.</p>
        </div>
        <Link
          href="/layer3-application/assets/new"
          className="bg-navy-600 hover:bg-navy-500 rounded px-4 py-2 text-sm font-medium text-white"
        >
          New Asset
        </Link>
      </div>

      {/* Summary bar with risk pills */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <span className="text-sm font-medium text-slate-700">Total: {data.length}</span>
        <span className="h-4 w-px bg-gray-200" aria-hidden />
        {Object.entries(byEuRisk).map(([k, v]) => (
          <span
            key={k}
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${riskPillColors[k] ?? riskPillColors.UNSET}`}
          >
            {riskLabels[k] ?? "—"}: {v}
          </span>
        ))}
      </div>

      <AssetFilters />

      {data.length === 0 ? (
        <EmptyState
          title="Add your first AI asset"
          description="Start tracking compliance and risk by registering your AI models, agents, and applications."
          ctaLabel="New Asset"
          ctaHref="/layer3-application/assets/new"
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-2 text-left font-medium text-slate-600">Asset</th>
                <th className="px-4 py-2 text-left font-medium text-slate-600">EU Risk</th>
                <th className="px-4 py-2 text-left font-medium text-slate-600">Owner</th>
                <th className="px-4 py-2 text-left font-medium text-slate-600">Compliance</th>
                <th className="px-4 py-2 text-left font-medium text-slate-600">Autonomy</th>
              </tr>
            </thead>
            <tbody>
              {data.map((a) => {
                const ownerEmail = a.owner?.email ?? "—";
                const ownerInitials =
                  ownerEmail !== "—" ? ownerEmail.slice(0, 2).toUpperCase() : "—";
                const compliance =
                  (a as { compliancePercentage?: number }).compliancePercentage ?? 0;
                return (
                  <tr
                    key={a.id}
                    className="border-b border-slate-100 bg-white transition last:border-0"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                          <AssetTypeIcon type={a.assetType} />
                        </div>
                        <div>
                          <Link
                            href={`/layer3-application/assets/${a.id}`}
                            className="text-navy-600 font-medium hover:underline"
                          >
                            {a.name}
                          </Link>
                          <div className="text-xs text-slate-500">
                            {assetTypeLabels[a.assetType] ?? a.assetType} ·{" "}
                            {statusLabels[a.status] ?? a.status}
                          </div>
                          {a.clientVertical && (
                            <span className="bg-navy-100 text-navy-700 mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium">
                              {a.clientVertical.replace(/_/g, " ")}
                            </span>
                          )}
                          <VerticalRegulationBadge
                            asset={{
                              name: a.name,
                              assetType: a.assetType,
                              description: a.description
                            }}
                            verticalKey={verticalKey}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <EURiskBadge level={a.euRiskLevel} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-medium text-slate-600">
                          {ownerInitials}
                        </div>
                        <span className="text-slate-700">{ownerEmail}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <ComplianceRing percentage={compliance} size={36} strokeWidth={3} />
                    </td>
                    <td className="px-4 py-3">
                      <AutonomyBadge level={a.autonomyLevel} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
