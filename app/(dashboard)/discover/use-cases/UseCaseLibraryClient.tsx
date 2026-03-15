"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ChevronRight, Play, Plus } from "lucide-react";
import type { UseCase } from "@/lib/use-cases/catalog";

const VERTICAL_COLORS: Record<string, string> = {
  MANUFACTURING: "bg-slate-100 text-slate-700",
  FINANCIAL: "bg-emerald-100 text-emerald-700",
  HEALTHCARE: "bg-rose-100 text-rose-700",
  HR: "bg-blue-100 text-blue-700",
  RETAIL: "bg-amber-100 text-amber-700",
  CUSTOMER_SERVICE: "bg-violet-100 text-violet-700"
};

const RISK_COLORS: Record<string, string> = {
  MINIMAL: "bg-gray-100 text-gray-700",
  LIMITED: "bg-amber-100 text-amber-700",
  HIGH: "bg-orange-100 text-orange-700",
  UNACCEPTABLE: "bg-red-100 text-red-700"
};

const COMPLEXITY_COLORS: Record<string, string> = {
  LOW: "bg-emerald-100 text-emerald-700",
  MEDIUM: "bg-amber-100 text-amber-700",
  HIGH: "bg-red-100 text-red-700"
};

type Props = { useCases: UseCase[] };

export function UseCaseLibraryClient({ useCases }: Props) {
  const [vertical, setVertical] = useState("ALL");
  const [riskLevel, setRiskLevel] = useState("ALL");
  const [assetType, setAssetType] = useState("ALL");
  const [autonomy, setAutonomy] = useState("ALL");
  const [selected, setSelected] = useState<UseCase | null>(null);

  const filtered = useMemo(() => {
    return useCases.filter((u) => {
      if (vertical !== "ALL" && u.vertical !== vertical) return false;
      if (riskLevel !== "ALL" && u.euRiskLevel !== riskLevel) return false;
      if (assetType !== "ALL" && u.assetType !== assetType) return false;
      if (autonomy !== "ALL" && u.autonomyLevel !== autonomy) return false;
      return true;
    });
  }, [useCases, vertical, riskLevel, assetType, autonomy]);

  const discoveryUrl = (uc: UseCase) => {
    const params = new URLSearchParams();
    params.set("useCase", uc.id);
    return `/discover/wizard?${params.toString()}`;
  };

  const assetUrl = (uc: UseCase) => {
    const params = new URLSearchParams();
    params.set("useCase", uc.id);
    return `/layer3-application/assets/new?${params.toString()}`;
  };

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Main content */}
      <div className="flex-1">
        {/* Filter bar */}
        <div className="mb-4 flex flex-wrap items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 text-slate-900">
          <div className="flex items-center gap-2">
            <label htmlFor="filter-vertical" className="text-sm font-medium text-slate-600">
              Vertical
            </label>
            <select
              id="filter-vertical"
              value={vertical}
              onChange={(e) => setVertical(e.target.value)}
              className="min-w-[140px] rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            >
              <option value="ALL">All Verticals</option>
              <option value="MANUFACTURING">Manufacturing</option>
              <option value="FINANCIAL">Financial</option>
              <option value="HEALTHCARE">Healthcare</option>
              <option value="HR">HR</option>
              <option value="RETAIL">Retail</option>
              <option value="CUSTOMER_SERVICE">Customer Service</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="filter-risk" className="text-sm font-medium text-slate-600">
              Risk Level
            </label>
            <select
              id="filter-risk"
              value={riskLevel}
              onChange={(e) => setRiskLevel(e.target.value)}
              className="min-w-[140px] rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="MINIMAL">MINIMAL</option>
              <option value="LIMITED">LIMITED</option>
              <option value="HIGH">HIGH</option>
              <option value="UNACCEPTABLE">UNACCEPTABLE</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="filter-asset" className="text-sm font-medium text-slate-600">
              Asset Type
            </label>
            <select
              id="filter-asset"
              value={assetType}
              onChange={(e) => setAssetType(e.target.value)}
              className="min-w-[140px] rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            >
              <option value="ALL">All Types</option>
              <option value="MODEL">MODEL</option>
              <option value="AGENT">AGENT</option>
              <option value="APPLICATION">APPLICATION</option>
              <option value="PIPELINE">PIPELINE</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="filter-autonomy" className="text-sm font-medium text-slate-600">
              Autonomy Level
            </label>
            <select
              id="filter-autonomy"
              value={autonomy}
              onChange={(e) => setAutonomy(e.target.value)}
              className="min-w-[140px] rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            >
              <option value="ALL">All Levels</option>
              <option value="L0">L0</option>
              <option value="L1">L1</option>
              <option value="L2">L2</option>
              <option value="L3">L3</option>
              <option value="L4">L4</option>
              <option value="L5">L5</option>
            </select>
          </div>
        </div>

        {/* Result count */}
        <p className="mb-3 text-sm text-slate-600">
          Showing {filtered.length} of {useCases.length} use cases
        </p>

        {/* Use case cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((uc) => (
            <button
              key={uc.id}
              type="button"
              onClick={() => setSelected(uc)}
              className="rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-navy-300 hover:shadow"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium text-slate-900">{uc.name}</h3>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-slate-600">{uc.description}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                <span className={`rounded px-2 py-0.5 text-xs font-medium ${VERTICAL_COLORS[uc.vertical] ?? "bg-gray-100 text-gray-700"}`}>
                  {uc.vertical.replace(/_/g, " ")}
                </span>
                <span className={`rounded px-2 py-0.5 text-xs font-medium ${RISK_COLORS[uc.euRiskLevel] ?? "bg-gray-100 text-gray-700"}`}>
                  {uc.euRiskLevel}
                </span>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                  {uc.autonomyLevel}
                </span>
                <span className={`rounded px-2 py-0.5 text-xs font-medium ${COMPLEXITY_COLORS[uc.governanceComplexity] ?? "bg-gray-100 text-gray-700"}`}>
                  {uc.governanceComplexity}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="w-full rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:w-96 lg:shrink-0">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-slate-900">{selected.name}</h3>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              ×
            </button>
          </div>
          <p className="mt-2 text-sm text-slate-600">{selected.description}</p>

          <div className="mt-4">
            <h4 className="text-xs font-medium text-slate-500">Typical data requirements</h4>
            <p className="mt-1 text-sm text-slate-700">{selected.typicalDataTypes.join(", ")}</p>
          </div>

          <div className="mt-4">
            <h4 className="text-xs font-medium text-slate-500">Applicable regulations</h4>
            <p className="mt-1 text-sm text-slate-700">{selected.applicableRegulations.join(", ")}</p>
          </div>

          <div className="mt-4">
            <h4 className="text-xs font-medium text-slate-500">Required CoSAI controls by layer</h4>
            <ul className="mt-1 space-y-0.5 text-sm text-slate-700">
              {selected.requiredControls.map((c) => (
                <li key={c}>• {c}</li>
              ))}
            </ul>
          </div>

          <div className="mt-4">
            <span className="text-xs font-medium text-slate-500">Estimated maturity required: </span>
            <span className="text-sm font-medium text-slate-700">M{selected.estimatedMaturity}</span>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <Link
              href={discoveryUrl(selected)}
              className="flex items-center justify-center gap-2 rounded bg-navy-600 px-4 py-2 text-sm font-medium text-white hover:bg-navy-500"
            >
              <Play className="h-4 w-4" />
              Start with this template
            </Link>
            <Link
              href={assetUrl(selected)}
              className="flex items-center justify-center gap-2 rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Plus className="h-4 w-4" />
              Add to my assets
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
