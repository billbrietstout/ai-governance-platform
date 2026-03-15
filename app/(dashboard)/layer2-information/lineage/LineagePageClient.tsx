"use client";

import { useState } from "react";
import { DataLineageDAG } from "@/components/lineage/DataLineageDAG";

type DiagramData = {
  entities: {
    id: string;
    name: string;
    classification: string;
    aiAccessPolicy?: string;
    stewardName?: string | null;
    recordCount?: number | null;
  }[];
  assets: {
    id: string;
    name: string;
    euRiskLevel?: string | null;
  }[];
  lineage: {
    id: string;
    name: string;
    pipelineType: string;
    sourceEntityId: string | null;
    targetAssetId: string | null;
    status: string;
  }[];
  platformProviders: { id: string; name: string }[];
  assetHasScans: Record<string, boolean>;
};

type Props = { diagramData: DiagramData };

export function LineagePageClient({ diagramData }: Props) {
  const [highlightRestricted, setHighlightRestricted] = useState(false);

  const restrictedEntityIds = new Set(
    diagramData.entities
      .filter((e) => e.classification === "RESTRICTED" || e.classification === "CONFIDENTIAL")
      .map((e) => e.id)
  );

  const handleHighlightRestricted = () => {
    setHighlightRestricted(true);
  };

  if (
    diagramData.entities.length === 0 &&
    diagramData.assets.length === 0 &&
    diagramData.lineage.length === 0
  ) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-500">
        No lineage records yet — add a pipeline to see data flow visualization
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {restrictedEntityIds.size > 0 && (
          <button
            type="button"
            onClick={handleHighlightRestricted}
            className="rounded bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-200"
          >
            Highlight restricted data flow
          </button>
        )}
      </div>

      <DataLineageDAG
        entities={diagramData.entities}
        lineageRecords={diagramData.lineage}
        assets={diagramData.assets}
        platformProviders={diagramData.platformProviders}
        assetHasScans={diagramData.assetHasScans}
        highlightRestrictedTrigger={highlightRestricted}
      />
    </div>
  );
}
