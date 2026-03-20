"use client";

import { useState } from "react";
import Link from "next/link";

type Entity = { id: string; name: string };
type Asset = { id: string; name: string };
type Lineage = {
  id: string;
  name: string;
  pipelineType: string;
  sourceEntityId: string | null;
  targetAssetId: string | null;
};

type Props = {
  data: {
    entities: Entity[];
    assets: Asset[];
    lineage: Lineage[];
  };
};

const NODE_WIDTH = 140;
const NODE_HEIGHT = 36;
const GAP = 24;

export function LineageDiagram({ data }: Props) {
  const [selectedLineage, setSelectedLineage] = useState<Lineage | null>(null);

  const { entities, assets, lineage } = data;

  if (entities.length === 0 && assets.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded border border-dashed border-slate-300 bg-slate-50 text-slate-500">
        No entities or assets to display
      </div>
    );
  }

  const leftNodes = entities;
  const rightNodes = assets;
  const maxRows = Math.max(leftNodes.length, rightNodes.length, 1);
  const svgHeight = maxRows * (NODE_HEIGHT + GAP) + GAP * 2;
  const svgWidth = NODE_WIDTH * 2 + 120;

  const getLeftPos = (i: number) => ({ x: 20, y: GAP + i * (NODE_HEIGHT + GAP) });
  const getRightPos = (i: number) => ({
    x: svgWidth - NODE_WIDTH - 20,
    y: GAP + i * (NODE_HEIGHT + GAP)
  });

  const entityIndex = new Map(leftNodes.map((e, i) => [e.id, i]));
  const assetIndex = new Map(rightNodes.map((a, i) => [a.id, i]));

  const pathD = (srcId: string, tgtId: string) => {
    const si = entityIndex.get(srcId);
    const ti = assetIndex.get(tgtId);
    if (si == null || ti == null) return "";
    const src = getLeftPos(si);
    const tgt = getRightPos(ti);
    const sx = src.x + NODE_WIDTH;
    const sy = src.y + NODE_HEIGHT / 2;
    const tx = tgt.x;
    const ty = tgt.y + NODE_HEIGHT / 2;
    const mx = (sx + tx) / 2;
    return `M ${sx} ${sy} C ${mx} ${sy}, ${mx} ${ty}, ${tx} ${ty}`;
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded border border-slate-200 bg-slate-50 p-4">
        <svg width={svgWidth} height={svgHeight} className="min-w-full">
          {/* Connections */}
          {lineage
            .filter((l) => l.sourceEntityId && l.targetAssetId)
            .map((l) => {
              const d = pathD(l.sourceEntityId!, l.targetAssetId!);
              const isSelected = selectedLineage?.id === l.id;
              return (
                <path
                  key={l.id}
                  d={d}
                  fill="none"
                  stroke={isSelected ? "#1e3a5f" : "#94a3b8"}
                  strokeWidth={isSelected ? 3 : 1.5}
                  className="cursor-pointer"
                  onClick={() => setSelectedLineage(isSelected ? null : l)}
                />
              );
            })}
          {/* Left nodes (entities) */}
          {leftNodes.map((e, i) => {
            const { x, y } = getLeftPos(i);
            return (
              <g key={e.id}>
                <rect
                  x={x}
                  y={y}
                  width={NODE_WIDTH}
                  height={NODE_HEIGHT}
                  rx={6}
                  fill="white"
                  stroke="#64748b"
                  strokeWidth={1}
                />
                <Link href={`/layer2-information/lineage?source=${e.id}`}>
                  <text
                    x={x + NODE_WIDTH / 2}
                    y={y + NODE_HEIGHT / 2 + 4}
                    textAnchor="middle"
                    className="fill-slate-700 text-xs font-medium"
                  >
                    {e.name.length > 12 ? e.name.slice(0, 10) + "…" : e.name}
                  </text>
                </Link>
              </g>
            );
          })}
          {/* Right nodes (assets) */}
          {rightNodes.map((a, i) => {
            const { x, y } = getRightPos(i);
            return (
              <g key={a.id}>
                <rect
                  x={x}
                  y={y}
                  width={NODE_WIDTH}
                  height={NODE_HEIGHT}
                  rx={6}
                  fill="white"
                  stroke="#64748b"
                  strokeWidth={1}
                />
                <Link href={`/layer3-application/assets/${a.id}`}>
                  <text
                    x={x + NODE_WIDTH / 2}
                    y={y + NODE_HEIGHT / 2 + 4}
                    textAnchor="middle"
                    className="fill-slate-700 text-xs font-medium"
                  >
                    {a.name.length > 12 ? a.name.slice(0, 10) + "…" : a.name}
                  </text>
                </Link>
              </g>
            );
          })}
        </svg>
      </div>

      {selectedLineage && (
        <div className="border-navy-200 bg-navy-50 rounded-lg border p-4">
          <h3 className="text-navy-900 font-medium">Pipeline: {selectedLineage.name}</h3>
          <p className="text-navy-700 mt-1 text-sm">Type: {selectedLineage.pipelineType}</p>
          <button
            type="button"
            onClick={() => setSelectedLineage(null)}
            className="text-navy-600 mt-2 text-sm hover:underline"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
