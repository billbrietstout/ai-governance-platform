/**
 * AI Asset Inventory – card/table hybrid with compliance metrics.
 */
import Link from "next/link";
import { auth } from "@/auth";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/EmptyState";
import { AssetFilters } from "./AssetFilters";
import { PageHeader } from "@/components/layout/PageHeader";
import { AssetsInventoryTable } from "@/components/assets/AssetsInventoryTable";

/** Matches `assets.list` tRPC input (filters + pagination). */
type AssetListInput = {
  assetType?:
    | "MODEL"
    | "PROMPT"
    | "AGENT"
    | "DATASET"
    | "APPLICATION"
    | "TOOL"
    | "PIPELINE";
  euRiskLevel?: "MINIMAL" | "LIMITED" | "HIGH" | "UNACCEPTABLE" | null;
  cosaiLayer?:
    | "LAYER_1_BUSINESS"
    | "LAYER_2_INFORMATION"
    | "LAYER_3_APPLICATION"
    | "LAYER_4_PLATFORM"
    | "LAYER_5_SUPPLY_CHAIN"
    | null;
  verticalMarket?:
    | "GENERAL"
    | "HEALTHCARE"
    | "FINANCIAL"
    | "INSURANCE"
    | "AUTOMOTIVE"
    | "RETAIL"
    | "MANUFACTURING"
    | "PUBLIC_SECTOR"
    | "ENERGY"
    | null;
  operatingModel?: "IN_HOUSE" | "VENDOR" | "HYBRID" | null;
  status?: "DRAFT" | "ACTIVE" | "DEPRECATED" | "ARCHIVED";
  cursor?: string;
  limit?: number;
};

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
      status: params.status as "DRAFT" | "ACTIVE" | "DEPRECATED" | "ARCHIVED" | undefined,
      limit: 25
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

  const { data, meta } = assetsRes;
  const listInput: AssetListInput = {
    assetType: params.type as AssetListInput["assetType"],
    euRiskLevel: params.euRisk as AssetListInput["euRiskLevel"],
    cosaiLayer: params.layer as AssetListInput["cosaiLayer"],
    verticalMarket: params.vertical as AssetListInput["verticalMarket"],
    operatingModel: params.operatingModel as AssetListInput["operatingModel"],
    status: params.status as AssetListInput["status"],
    limit: 25
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-6 px-6 py-10">
      <PageHeader
        title="Asset Inventory"
        subtitle="Filterable asset table with compliance metrics."
        actions={
          <Link
            href="/layer3-application/assets/new"
            className="bg-navy-600 hover:bg-navy-500 focus-visible:ring-navy-500 rounded px-4 py-2 text-sm font-medium text-white focus-visible:ring-2 focus-visible:ring-offset-2"
          >
            New Asset
          </Link>
        }
      />

      <AssetFilters />

      {data.length === 0 ? (
        <EmptyState
          title="Add your first AI asset"
          description="Start tracking compliance and risk by registering your AI models, agents, and applications."
          ctaLabel="New Asset"
          ctaHref="/layer3-application/assets/new"
        />
      ) : (
        <AssetsInventoryTable
          initialAssets={data}
          initialNextCursor={meta.nextCursor ?? null}
          listInput={listInput}
          totalCount={meta.totalCount ?? data.length}
          euRiskCounts={meta.euRiskCounts ?? {}}
          verticalMarket={org?.verticalMarket ?? null}
        />
      )}
    </main>
  );
}
