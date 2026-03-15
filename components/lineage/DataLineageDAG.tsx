"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

export type MasterDataEntityNode = {
  id: string;
  name: string;
  classification: string;
  aiAccessPolicy?: string;
  stewardName?: string | null;
  recordCount?: number | null;
};

export type LineageRecordNode = {
  id: string;
  name: string;
  pipelineType: string;
  status: string;
  sourceEntityId: string | null;
  targetAssetId: string | null;
};

export type AIAssetNode = {
  id: string;
  name: string;
  euRiskLevel?: string | null;
};

export type PlatformNode = {
  id: string;
  name: string;
};

type Props = {
  entities: MasterDataEntityNode[];
  lineageRecords: LineageRecordNode[];
  assets: AIAssetNode[];
  platformProviders?: PlatformNode[];
  assetHasScans?: Record<string, boolean>;
  highlightRestrictedTrigger?: boolean;
};

const CLASSIFICATION_COLORS: Record<string, string> = {
  PUBLIC: "#10b981",
  INTERNAL: "#3b82f6",
  CONFIDENTIAL: "#f97316",
  RESTRICTED: "#dc2626"
};

const RISK_COLORS: Record<string, string> = {
  HIGH: "#dc2626",
  UNACCEPTABLE: "#dc2626",
  MEDIUM: "#f97316",
  LIMITED: "#f97316",
  LOW: "#10b981",
  MINIMAL: "#10b981"
};

const NODE_WIDTH = 140;
const NODE_HEIGHT = 36;
const COL_GAP = 80;
const ROW_GAP = 16;

function getDownstreamIds(
  lineageRecords: LineageRecordNode[],
  entityId: string
): Set<string> {
  const ids = new Set<string>([entityId]);
  const queue = [entityId];
  const visited = new Set<string>();
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);
    for (const lr of lineageRecords) {
      if (lr.sourceEntityId === current && lr.targetAssetId) {
        ids.add(`asset-${lr.targetAssetId}`);
        ids.add(`pipeline-${lr.id}`);
        if (!ids.has(lr.targetAssetId)) queue.push(lr.targetAssetId);
      }
    }
  }
  return ids;
}

export function DataLineageDAG({
  entities,
  lineageRecords,
  assets,
  platformProviders = [],
  assetHasScans = {},
  highlightRestrictedTrigger = false
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [highlightedDownstream, setHighlightedDownstream] = useState<Set<string>>(new Set());
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    content: React.ReactNode;
  } | null>(null);
  const [classificationFilter, setClassificationFilter] = useState<string | null>(null);
  const [activeOnly, setActiveOnly] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const filteredRecords = lineageRecords.filter((lr) => {
    if (activeOnly && lr.status !== "ACTIVE") return false;
    return true;
  });

  useEffect(() => {
    if (!highlightRestrictedTrigger) return;
    const restricted = entities.filter(
      (e) => e.classification === "RESTRICTED" || e.classification === "CONFIDENTIAL"
    );
    const allDownstream = new Set<string>();
    for (const e of restricted) {
      const ds = getDownstreamIds(filteredRecords, e.id);
      ds.forEach((id) => allDownstream.add(id));
    }
    setHighlightedDownstream(allDownstream);
  }, [highlightRestrictedTrigger, entities, filteredRecords]);

  const filteredEntities = entities.filter((e) => {
    if (classificationFilter && e.classification !== classificationFilter) return false;
    return true;
  });

  const entityIds = new Set(filteredEntities.map((e) => e.id));
  const assetIds = new Set(assets.map((a) => a.id));

  const usedEntities = new Set<string>();
  const usedAssets = new Set<string>();
  for (const lr of filteredRecords) {
    if (lr.sourceEntityId && entityIds.has(lr.sourceEntityId)) usedEntities.add(lr.sourceEntityId);
    if (lr.targetAssetId && assetIds.has(lr.targetAssetId)) usedAssets.add(lr.targetAssetId);
  }

  const col1 = filteredEntities.filter((e) => usedEntities.has(e.id));
  const col2 = filteredRecords.filter((l) => l.sourceEntityId && l.targetAssetId);
  const col3 = assets.filter((a) => usedAssets.has(a.id));
  const col4 = platformProviders.length > 0 ? platformProviders : [];
  const assetsWithScans = assets.filter((a) => assetHasScans[a.id]);

  const columns = [col1, col2, col3, col4];
  const maxRows = Math.max(...columns.map((c) => c.length), 1);
  const width = 4 * NODE_WIDTH + 3 * COL_GAP + 80;
  const height = Math.max(400, maxRows * (NODE_HEIGHT + ROW_GAP) + 60);

  const getPos = (colIdx: number, rowIdx: number) => ({
    x: 40 + colIdx * (NODE_WIDTH + COL_GAP),
    y: 40 + rowIdx * (NODE_HEIGHT + ROW_GAP)
  });

  const pathD = (sx: number, sy: number, tx: number, ty: number) => {
    const mx = (sx + tx) / 2;
    return `M ${sx + NODE_WIDTH} ${sy + NODE_HEIGHT / 2} C ${mx} ${sy + NODE_HEIGHT / 2}, ${mx} ${ty + NODE_HEIGHT / 2}, ${tx} ${ty + NODE_HEIGHT / 2}`;
  };

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g");

    const entityPos = new Map<string, { x: number; y: number }>();
    const pipelinePos = new Map<string, { x: number; y: number }>();
    const assetPos = new Map<string, { x: number; y: number }>();
    const platformPos = new Map<string, { x: number; y: number }>();

    col1.forEach((e, i) => {
      const p = getPos(0, i);
      entityPos.set(e.id, p);
    });
    col2.forEach((l, i) => {
      const p = getPos(1, i);
      pipelinePos.set(l.id, p);
    });
    col3.forEach((a, i) => {
      const p = getPos(2, i);
      assetPos.set(a.id, p);
    });
    col4.forEach((p, i) => {
      const pos = getPos(3, i);
      platformPos.set(p.id, pos);
    });

    const getSourceColor = (sourceEntityId: string | null) => {
      if (!sourceEntityId) return "#94a3b8";
      const ent = entities.find((e) => e.id === sourceEntityId);
      return ent ? CLASSIFICATION_COLORS[ent.classification] ?? "#64748b" : "#94a3b8";
    };

    filteredRecords.forEach((lr) => {
      if (!lr.sourceEntityId || !lr.targetAssetId) return;
      const sp = entityPos.get(lr.sourceEntityId);
      const pp = pipelinePos.get(lr.id);
      const tp = assetPos.get(lr.targetAssetId);
      if (!sp || !pp || !tp) return;

      const dashed = lr.status !== "ACTIVE";
      const color = getSourceColor(lr.sourceEntityId);

      const d1 = pathD(sp.x, sp.y, pp.x, pp.y);
      g.append("path")
        .attr("d", d1)
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", dashed ? "6 4" : "none")
        .attr("marker-end", "url(#arrowhead)")
        .attr("opacity", 0.8);

      const d2 = pathD(pp.x, pp.y, tp.x, tp.y);
      g.append("path")
        .attr("d", d2)
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", dashed ? "6 4" : "none")
        .attr("marker-end", "url(#arrowhead)")
        .attr("opacity", 0.8);

      const midX = (sp.x + NODE_WIDTH + pp.x) / 2;
      const midY = sp.y + NODE_HEIGHT / 2;
      g.append("text")
        .attr("x", midX)
        .attr("y", midY - 6)
        .attr("text-anchor", "middle")
        .attr("font-size", 9)
        .attr("fill", "#64748b")
        .text(lr.pipelineType);
    });

    if (col4.length > 0) {
      assetsWithScans.forEach((a) => {
        const ap = assetPos.get(a.id);
        const pp = platformPos.get(col4[0].id);
        if (ap && pp) {
          const d = pathD(ap.x, ap.y, pp.x, pp.y);
          g.append("path")
            .attr("d", d)
            .attr("fill", "none")
            .attr("stroke", "#94a3b8")
            .attr("stroke-width", 1.5)
            .attr("marker-end", "url(#arrowhead)")
            .attr("opacity", 0.6);
        }
      });
    }

    const defs = g.append("defs");
    defs
      .append("marker")
      .attr("id", "arrowhead")
      .attr("markerWidth", 10)
      .attr("markerHeight", 7)
      .attr("refX", 9)
      .attr("refY", 3.5)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M 0 0 L 10 3.5 L 0 7 z")
      .attr("fill", "#64748b");

    col1.forEach((e, i) => {
      const p = getPos(0, i);
      const color = CLASSIFICATION_COLORS[e.classification] ?? "#64748b";
      const isRestricted = e.classification === "RESTRICTED" || e.classification === "CONFIDENTIAL";
      const isHighlighted =
        highlightedDownstream.size === 0 || highlightedDownstream.has(e.id);

      const node = g
        .append("g")
        .attr("transform", `translate(${p.x},${p.y})`)
        .attr("cursor", isRestricted ? "pointer" : "default")
        .attr("opacity", isHighlighted ? 1 : 0.25)
        .on("click", () => {
          if (isRestricted) {
            const downstream = getDownstreamIds(filteredRecords, e.id);
            setHighlightedDownstream(downstream);
          }
        })
        .on("mouseenter", (event) => {
          setTooltip({
            x: event.clientX + 12,
            y: event.clientY + 12,
            content: (
              <div className="text-xs">
                <div className="font-medium">{e.name}</div>
                <div>Classification: {e.classification}</div>
                {e.aiAccessPolicy && <div>AI Access: {e.aiAccessPolicy}</div>}
                {e.stewardName && <div>Steward: {e.stewardName}</div>}
                {e.recordCount != null && <div>Records: {e.recordCount.toLocaleString()}</div>}
              </div>
            )
          });
        })
        .on("mouseleave", () => setTooltip(null));

      node
        .append("rect")
        .attr("width", 4)
        .attr("height", NODE_HEIGHT)
        .attr("x", 0)
        .attr("y", 0)
        .attr("fill", color);
      node
        .append("rect")
        .attr("width", NODE_WIDTH - 4)
        .attr("height", NODE_HEIGHT)
        .attr("x", 4)
        .attr("y", 0)
        .attr("fill", "white")
        .attr("stroke", "#e2e8f0")
        .attr("stroke-width", 1);
      node
        .append("text")
        .attr("x", NODE_WIDTH / 2)
        .attr("y", NODE_HEIGHT / 2 + 4)
        .attr("text-anchor", "middle")
        .attr("font-size", 11)
        .attr("fill", "#334155")
        .text(e.name.length > 14 ? e.name.slice(0, 12) + "…" : e.name);
    });

    col2.forEach((l, i) => {
      const p = getPos(1, i);
      const isHighlighted =
        highlightedDownstream.size === 0 ||
        highlightedDownstream.has(`pipeline-${l.id}`);

      const node = g
        .append("g")
        .attr("transform", `translate(${p.x},${p.y})`)
        .attr("opacity", isHighlighted ? 1 : 0.25);

      const cx = NODE_WIDTH / 2;
      const cy = NODE_HEIGHT / 2;
      const points = [
        [cx, 2],
        [NODE_WIDTH - 2, cy],
        [cx, NODE_HEIGHT - 2],
        [2, cy]
      ];
      node
        .append("polygon")
        .attr("points", points.map(([x, y]) => `${x},${y}`).join(" "))
        .attr("fill", "#e2e8f0")
        .attr("stroke", "#94a3b8")
        .attr("stroke-width", 1);
      node
        .append("text")
        .attr("x", NODE_WIDTH / 2)
        .attr("y", NODE_HEIGHT / 2 + 4)
        .attr("text-anchor", "middle")
        .attr("font-size", 10)
        .attr("fill", "#64748b")
        .text(l.name.length > 10 ? l.name.slice(0, 8) + "…" : l.name);
    });

    col3.forEach((a, i) => {
      const p = getPos(2, i);
      const color = RISK_COLORS[a.euRiskLevel ?? ""] ?? "#64748b";
      const isHighlighted =
        highlightedDownstream.size === 0 || highlightedDownstream.has(`asset-${a.id}`);

      const node = g
        .append("g")
        .attr("transform", `translate(${p.x},${p.y})`)
        .attr("cursor", "pointer")
        .attr("opacity", isHighlighted ? 1 : 0.25)
        .on("click", () => {
          window.location.href = `/layer3-application/assets/${a.id}`;
        })
        .on("mouseenter", (event) => {
          setTooltip({
            x: event.clientX + 12,
            y: event.clientY + 12,
            content: (
              <div className="text-xs">
                <div className="font-medium">{a.name}</div>
                {a.euRiskLevel && <div>EU Risk: {a.euRiskLevel}</div>}
              </div>
            )
          });
        })
        .on("mouseleave", () => setTooltip(null));

      node
        .append("rect")
        .attr("width", NODE_WIDTH)
        .attr("height", NODE_HEIGHT)
        .attr("rx", 6)
        .attr("fill", "white")
        .attr("stroke", color)
        .attr("stroke-width", 2);
      node
        .append("text")
        .attr("x", NODE_WIDTH / 2)
        .attr("y", NODE_HEIGHT / 2 + 4)
        .attr("text-anchor", "middle")
        .attr("font-size", 11)
        .attr("fill", "#334155")
        .text(a.name.length > 14 ? a.name.slice(0, 12) + "…" : a.name);
    });

    col4.forEach((pl, i) => {
      const p = getPos(3, i);
      const node = g.append("g").attr("transform", `translate(${p.x},${p.y})`);

      node
        .append("rect")
        .attr("width", NODE_WIDTH)
        .attr("height", NODE_HEIGHT)
        .attr("fill", "#f8fafc")
        .attr("stroke", "#cbd5e1")
        .attr("stroke-width", 1);
      node
        .append("text")
        .attr("x", NODE_WIDTH / 2)
        .attr("y", NODE_HEIGHT / 2 - 6)
        .attr("text-anchor", "middle")
        .attr("font-size", 16)
        .attr("fill", "#94a3b8")
        .text("☁");
      node
        .append("text")
        .attr("x", NODE_WIDTH / 2)
        .attr("y", NODE_HEIGHT / 2 + 10)
        .attr("text-anchor", "middle")
        .attr("font-size", 10)
        .attr("fill", "#64748b")
        .text(pl.name.length > 14 ? pl.name.slice(0, 12) + "…" : pl.name);
    });

    return () => {
      svg.selectAll("*").remove();
    };
  }, [
    col1,
    col2,
    col3,
    col4,
    filteredRecords,
    entities,
    highlightedDownstream
  ]);

  if (col1.length === 0 && col3.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-500">
        No lineage records yet — add a pipeline to see data flow visualization
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          <label className="flex items-center gap-1.5 text-sm">
            <input
              type="checkbox"
              checked={classificationFilter === "RESTRICTED"}
              onChange={(e) =>
                setClassificationFilter(e.target.checked ? "RESTRICTED" : null)
              }
              className="rounded"
            />
            RESTRICTED flow only
          </label>
          <label className="flex items-center gap-1.5 text-sm">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
              className="rounded"
            />
            Active pipelines only
          </label>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
          >
            {expanded ? "Collapse to summary" : "Expand all"}
          </button>
          <button
            type="button"
            onClick={() => setHighlightedDownstream(new Set())}
            className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
          >
            Clear highlight
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white p-4">
        <svg
          ref={svgRef}
          width={width}
          height={height}
          className="min-w-full"
        />
      </div>

      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 rounded border border-slate-200 bg-white px-3 py-2 text-slate-700 shadow-lg"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
}
