"use client";

import { getAssetRegulations } from "@/lib/vertical-regulations";
import type { VerticalKey } from "@/lib/vertical-regulations";

type Props = {
  asset: { name: string; assetType: string; description?: string | null };
  verticalKey: VerticalKey;
};

export function VerticalRegulationBadge({ asset, verticalKey }: Props) {
  const regulations = getAssetRegulations(asset, verticalKey);
  if (regulations.length === 0) return null;

  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {regulations.map((r) => (
        <span
          key={r.code}
          className="rounded bg-navy-100 px-1.5 py-0.5 text-[10px] font-medium text-navy-700"
          title={r.name}
        >
          {r.code}
        </span>
      ))}
    </div>
  );
}
