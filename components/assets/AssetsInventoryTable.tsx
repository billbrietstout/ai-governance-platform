"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { getTrpcBrowser } from "@/lib/trpc/browser-client";
import { orgVerticalToKey } from "@/lib/vertical-regulations";
import { EURiskBadge } from "@/components/assets/EURiskBadge";
import { AutonomyBadge } from "@/components/assets/AutonomyBadge";
import { ComplianceRing } from "@/components/assets/ComplianceRing";
import { AssetTypeIcon } from "@/components/assets/AssetTypeIcon";
import { VerticalRegulationBadge } from "@/components/assets/VerticalRegulationBadge";

type AssetRow = {
  id: string;
  name: string;
  assetType: string;
  status: string;
  euRiskLevel: string | null;
  autonomyLevel: string | null;
  description: string | null;
  clientVertical: string | null;
  owner: { id: string; email: string } | null;
  compliancePercentage?: number;
};

/** Matches `assets.list` tRPC input. */
type ListInput = {
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

type Props = {
  initialAssets: AssetRow[];
  initialNextCursor: string | null;
  listInput: ListInput;
  totalCount: number;
  euRiskCounts: Record<string, number>;
  verticalMarket: string | null;
};

export function AssetsInventoryTable({
  initialAssets,
  initialNextCursor,
  listInput,
  totalCount,
  euRiskCounts,
  verticalMarket
}: Props) {
  const [items, setItems] = useState<AssetRow[]>(initialAssets);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [loading, setLoading] = useState(false);
  const verticalKey = orgVerticalToKey(verticalMarket);

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

  const byEuRisk = useMemo(() => {
    const m: Record<string, number> = { ...euRiskCounts };
    return m;
  }, [euRiskCounts]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loading) return;
    setLoading(true);
    try {
      const trpc = getTrpcBrowser();
      const res = await trpc.assets.list.query({
        ...listInput,
        cursor: nextCursor,
        limit: listInput.limit ?? 25
      });
      setItems((prev) => [...prev, ...(res.data as AssetRow[])]);
      setNextCursor(res.meta.nextCursor ?? null);
    } finally {
      setLoading(false);
    }
  }, [nextCursor, loading, listInput]);

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <span className="text-sm font-medium text-slate-700">Total: {totalCount}</span>
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

      {items.length === 0 ? null : (
        <>
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
                {items.map((a) => {
                  const ownerEmail = a.owner?.email ?? "—";
                  const ownerInitials =
                    ownerEmail !== "—" ? ownerEmail.slice(0, 2).toUpperCase() : "—";
                  const compliance = a.compliancePercentage ?? 0;
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
                              className="font-medium text-navy-600 hover:underline"
                            >
                              {a.name}
                            </Link>
                            <div className="text-xs text-slate-500">
                              {assetTypeLabels[a.assetType] ?? a.assetType} ·{" "}
                              {statusLabels[a.status] ?? a.status}
                            </div>
                            {a.clientVertical && (
                              <span className="mt-1 inline-block rounded bg-navy-100 px-1.5 py-0.5 text-[10px] font-medium text-navy-700">
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
                        <EURiskBadge
                          level={
                            a.euRiskLevel as
                              | "MINIMAL"
                              | "LIMITED"
                              | "HIGH"
                              | "UNACCEPTABLE"
                              | null
                          }
                        />
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
                        <AutonomyBadge
                          level={
                            a.autonomyLevel as
                              | "HUMAN_ONLY"
                              | "ASSISTED"
                              | "SEMI_AUTONOMOUS"
                              | "AUTONOMOUS"
                              | null
                          }
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {nextCursor && (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={() => void loadMore()}
                disabled={loading}
                className="focus-visible:ring-navy-500 text-sm font-medium text-navy-600 hover:underline focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50"
              >
                {loading ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
