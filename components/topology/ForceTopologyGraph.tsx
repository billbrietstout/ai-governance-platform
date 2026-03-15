"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import Link from "next/link";

export type TopologyNode = {
  id: string;
  label: string;
  layer: "L1" | "L2" | "L3" | "L4" | "L5";
  role: string;
  link?: string;
  recordCount?: number;
  euRiskLevel?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  assetType?: string;
  isCluster?: boolean;
  isIsolated?: boolean;
};

export type TopologyEdge = {
  from: string;
  to: string;
  type: "lineage" | "platform" | "model" | "governance";
};

type SimNode = TopologyNode & d3.SimulationNodeDatum;

type Props = {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
  onNodeClick?: (node: TopologyNode) => void;
  height?: number;
};

const LAYER_ORDER = ["L1", "L2", "L3", "L4", "L5"] as const;
const LAYER_INDEX: Record<string, number> = { L1: 0, L2: 1, L3: 2, L4: 3, L5: 4 };

function getNodeRadius(node: TopologyNode): number {
  if (node.layer === "L3" && node.euRiskLevel) {
    const r: Record<string, number> = { HIGH: 22, CRITICAL: 22, MEDIUM: 18, LOW: 14 };
    return r[node.euRiskLevel] ?? 18;
  }
  return 18;
}

function getConnectedIds(edges: TopologyEdge[], nodeId: string): Set<string> {
  const ids = new Set<string>([nodeId]);
  for (const e of edges) {
    if (e.from === nodeId || e.to === nodeId) {
      ids.add(e.from);
      ids.add(e.to);
    }
  }
  return ids;
}

function hasEdges(edges: TopologyEdge[], nodeId: string): boolean {
  return edges.some((e) => e.from === nodeId || e.to === nodeId);
}

const LAYER_CLUSTER_LABELS: Record<string, string> = {
  L1: "Organizations",
  L2: "Data Entities",
  L3: "AI Assets",
  L4: "Platforms",
  L5: "Vendors"
};

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + "…";
}

function drawNodeShape(
  sel: d3.Selection<SVGGElement, SimNode, d3.BaseType, unknown>,
  node: TopologyNode
) {
  const color = {
    L1: "#1D9E75",
    L2: "#534AB7",
    L3: "#D85A30",
    L4: "#185FA5",
    L5: "#5F5E5A"
  }[node.layer] ?? "#64748b";

  sel.selectAll("*").remove();

  const scale = node.isIsolated ? 0.75 : 1;

  if (node.layer === "L1") {
    const w = 80 * scale;
    const h = 36 * scale;
    sel
      .append("rect")
      .attr("x", -w / 2)
      .attr("y", -h / 2)
      .attr("width", w)
      .attr("height", h)
      .attr("rx", 4)
      .attr("fill", color)
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);
    sel
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("x", 0)
      .attr("y", 0)
      .attr("font-size", 10)
      .attr("fill", "#fff")
      .text(truncate(node.label, 12));
  } else if (node.layer === "L2") {
    sel
      .append("ellipse")
      .attr("rx", 50 * scale)
      .attr("ry", 20 * scale)
      .attr("fill", color)
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);
    sel
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("x", 0)
      .attr("y", 0)
      .attr("font-size", 10)
      .attr("fill", "#fff")
      .text(truncate(node.label, 14));
  } else if (node.isCluster) {
    const r = 36;
    sel
      .append("circle")
      .attr("r", r)
      .attr("fill", color)
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);
    sel
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("x", 0)
      .attr("y", 0)
      .attr("font-size", 11)
      .attr("fill", "#fff")
      .attr("font-weight", 600)
      .text(node.label);
  } else if (node.layer === "L3") {
    const r = getNodeRadius(node);
    sel
      .append("circle")
      .attr("r", node.isIsolated ? r * 0.7 : r)
      .attr("fill", color)
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);
    sel
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("x", 0)
      .attr("y", 0)
      .attr("font-size", 9)
      .attr("fill", "#fff")
      .text(truncate(node.label, 10));
  } else if (node.layer === "L4" || node.layer === "L5") {
    const w = 80 * scale;
    const h = 32 * scale;
    sel
      .append("rect")
      .attr("x", -w / 2)
      .attr("y", -h / 2)
      .attr("width", w)
      .attr("height", h)
      .attr("rx", 4)
      .attr("fill", color)
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);
    sel
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("x", 0)
      .attr("y", 0)
      .attr("font-size", 10)
      .attr("fill", "#fff")
      .text(truncate(node.label, 12));
  } else {
    sel
      .append("circle")
      .attr("r", 18 * scale)
      .attr("fill", color)
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);
    sel
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("x", 0)
      .attr("y", 0)
      .attr("font-size", 9)
      .attr("fill", "#fff")
      .text(truncate(node.label, 10));
  }
}

export function ForceTopologyGraph({ nodes, edges, onNodeClick, height: heightProp = 500 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const height = heightProp;
  const [width, setWidth] = useState(800);

  const simulationRef = useRef<d3.Simulation<SimNode, TopologyEdge> | null>(null);
  const selectedRef = useRef<TopologyNode | null>(null);
  const [selected, setSelected] = useState<TopologyNode | null>(null);
  selectedRef.current = selected;
  const [layerFilter, setLayerFilter] = useState<Record<string, boolean>>(
    Object.fromEntries(LAYER_ORDER.map((l) => [l, true]))
  );
  const [layerExpanded, setLayerExpanded] = useState<Record<string, boolean>>(() => {
    const counts: Record<string, number> = {};
    for (const n of nodes) counts[n.layer] = (counts[n.layer] ?? 0) + 1;
    return Object.fromEntries(
      LAYER_ORDER.map((l) => [
        l,
        l === "L3" ? (counts[l] ?? 0) <= 10 : true
      ])
    ) as Record<string, boolean>;
  });
  const [showConnectedOnly, setShowConnectedOnly] = useState(false);

  const layerCounts: Record<string, number> = {};
  for (const n of nodes) layerCounts[n.layer] = (layerCounts[n.layer] ?? 0) + 1;

  let filteredNodes = nodes.filter((n) => layerFilter[n.layer]);
  if (showConnectedOnly) {
    const connectedIds = new Set<string>();
    for (const e of edges) {
      connectedIds.add(e.from);
      connectedIds.add(e.to);
    }
    filteredNodes = filteredNodes.filter((n) => connectedIds.has(n.id));
  }

  const displayedNodes: TopologyNode[] = [];
  const displayedEdges: TopologyEdge[] = [];
  const clusterIdByLayer: Record<string, string> = {};
  const displayedNodeIds = new Set<string>();

  for (const layer of LAYER_ORDER) {
    const layerNodes = filteredNodes.filter((n) => n.layer === layer);
    const count = layerNodes.length;
    const expanded = layerExpanded[layer] ?? true;
    const shouldCluster = count > 10 && !expanded;

    if (shouldCluster && count > 0) {
      const clusterId = `cluster-${layer}`;
      clusterIdByLayer[layer] = clusterId;
      displayedNodes.push({
        id: clusterId,
        label: `${count} ${LAYER_CLUSTER_LABELS[layer]}`,
        layer,
        role: "Cluster",
        isCluster: true
      });
      displayedNodeIds.add(clusterId);
    } else {
      for (const n of layerNodes) {
        displayedNodes.push({
          ...n,
          isIsolated: !hasEdges(edges, n.id)
        });
        displayedNodeIds.add(n.id);
      }
    }
  }

  const seenEdgeKeys = new Set<string>();
  for (const e of edges) {
    const fromNode = nodes.find((n) => n.id === e.from);
    const toNode = nodes.find((n) => n.id === e.to);
    const fromLayer = fromNode?.layer ?? "";
    const toLayer = toNode?.layer ?? "";
    const fromId = clusterIdByLayer[fromLayer] ?? e.from;
    const toId = clusterIdByLayer[toLayer] ?? e.to;
    if (
      fromId !== toId &&
      displayedNodeIds.has(fromId) &&
      displayedNodeIds.has(toId)
    ) {
      const key = fromId < toId ? `${fromId}-${toId}` : `${toId}-${fromId}`;
      if (!seenEdgeKeys.has(key)) {
        seenEdgeKeys.add(key);
        displayedEdges.push({ from: fromId, to: toId, type: e.type });
      }
    }
  }

  const runSimulation = useCallback(() => {
    if (!svgRef.current || !containerRef.current || displayedNodes.length === 0) return;

    const w = containerRef.current.clientWidth ?? 800;
    setWidth(w);

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g");

    const layerY = (layerIdx: number) => (layerIdx / 4) * (height - 80) + 40;
    const bandHeight = height / 5;

    for (let i = 0; i < 5; i++) {
      g.append("rect")
        .attr("x", 0)
        .attr("y", i * bandHeight)
        .attr("width", w)
        .attr("height", bandHeight)
        .attr("fill", "#f8fafc")
        .attr("stroke", "none");
      g.append("text")
        .attr("x", 12)
        .attr("y", layerY(i) + 4)
        .attr("font-size", 11)
        .attr("font-weight", 500)
        .attr("fill", "#475569")
        .text(`L${i + 1}`);
    }

    type SimNodeExt = SimNode & { x: number; y: number };
    const d3Nodes: SimNodeExt[] = displayedNodes.map((n) => ({
      ...n,
      x: w / 2,
      y: layerY(LAYER_INDEX[n.layer] ?? 0)
    }));
    const nodeById = new Map(d3Nodes.map((n) => [n.id, n]));
    const d3Edges = displayedEdges
      .filter((e) => nodeById.has(e.from) && nodeById.has(e.to))
      .map((e) => ({ ...e, source: nodeById.get(e.from)!, target: nodeById.get(e.to)! }));

    const link = g
      .append("g")
      .attr("class", "links")
      .selectAll<SVGLineElement, (typeof d3Edges)[number]>("line")
      .data(d3Edges)
      .join("line")
      .attr("stroke", "#cbd5e1")
      .attr("stroke-width", 1.5);

    const node = g
      .append("g")
      .attr("class", "nodes")
      .selectAll<SVGGElement, SimNodeExt>("g")
      .data(d3Nodes)
      .join("g")
      .attr("cursor", "move")
      .style("pointer-events", "all")
      .call(
        d3.drag<SVGGElement, SimNodeExt>()
          .on("start", (event) => {
            if (!event.active) simulationRef.current?.alphaTarget(0.3).restart();
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulationRef.current?.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      )
      .on("click", (event, d) => {
        event.stopPropagation();
        setSelected(d);
        onNodeClick?.(d);
      })
      .on("dblclick", (event, d) => {
        event.stopPropagation();
        if (d.link) window.location.href = d.link;
      });

    node.each(function (d) {
      drawNodeShape(d3.select(this), d);
    });
    node.append("title").text((d) => d.label);

    g.on("click", () => {
      setSelected(null);
    });

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });
    svg.call(zoom);

    const centerX = w / 2;
    const isIsolated = (n: SimNodeExt) => n.isIsolated ?? !hasEdges(displayedEdges, n.id);

    const simulation = d3
      .forceSimulation<SimNodeExt>(d3Nodes)
      .force("link", d3.forceLink(d3Edges).id((d) => (d as TopologyNode).id).distance(100))
      .force("charge", d3.forceManyBody().strength(-150))
      .force("collide", d3.forceCollide().radius(35))
      .force(
        "y",
        d3
          .forceY<SimNodeExt>((d) => layerY(LAYER_INDEX[d.layer] ?? 0))
          .strength((d) => (isIsolated(d) ? 1.0 : 0.8))
      )
      .force(
        "x",
        d3
          .forceX<SimNodeExt>(centerX)
          .strength((d) => (isIsolated(d) ? 0.4 : 0.05))
      )
      .alphaDecay(0.05)
      .on("tick", () => {
        link
          .attr("x1", (d) => (d.source as SimNodeExt).x)
          .attr("y1", (d) => (d.source as SimNodeExt).y)
          .attr("x2", (d) => (d.target as SimNodeExt).x)
          .attr("y2", (d) => (d.target as SimNodeExt).y)
          .attr("opacity", (d) => {
            const sel = selectedRef.current;
            if (!sel) return 1;
            const ids = getConnectedIds(displayedEdges, sel.id);
            return ids.has((d.source as SimNodeExt).id) && ids.has((d.target as SimNodeExt).id) ? 1 : 0.15;
          });
        node
          .attr("transform", (d) => `translate(${d.x},${d.y})`)
          .attr("opacity", (d) => {
            const sel = selectedRef.current;
            if (sel && getConnectedIds(displayedEdges, sel.id).has(d.id)) return 1;
            if (d.isIsolated) return 0.6;
            if (sel) return 0.2;
            return 1;
          });
      });

    simulationRef.current = simulation;
  }, [displayedNodes, displayedEdges, height, onNodeClick]);

  useEffect(() => {
    runSimulation();
    return () => {
      simulationRef.current?.stop();
    };
  }, [runSimulation]);

  useEffect(() => {
    if (selected && simulationRef.current) {
      simulationRef.current.alpha(0.1).restart();
    }
  }, [selected]);

  const byLayer: Record<string, number> = {};
  for (const n of displayedNodes) byLayer[n.layer] = (byLayer[n.layer] ?? 0) + 1;

  return (
    <div ref={containerRef} className="flex flex-col" style={{ height: height + 60 }}>
      <div className="mb-2 flex flex-wrap items-center gap-4 rounded-lg border border-slate-200 bg-white px-4 py-2">
        <div className="flex gap-2">
          {LAYER_ORDER.map((l) => (
            <label key={l} className="flex cursor-pointer items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                checked={layerFilter[l] ?? true}
                onChange={(e) => setLayerFilter((p) => ({ ...p, [l]: e.target.checked }))}
                className="rounded"
              />
              <span>{l}</span>
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">{byLayer[l] ?? 0}</span>
            </label>
          ))}
        </div>
        {layerCounts.L3 > 10 && (
          <button
            type="button"
            onClick={() => {
              setLayerExpanded((p) => ({ ...p, L3: !p.L3 }));
              setTimeout(runSimulation, 0);
            }}
            className="rounded border border-slate-300 bg-slate-50 px-3 py-1.5 text-sm hover:bg-slate-100"
          >
            {layerExpanded.L3 ? "Collapse L3" : "Expand L3"}
          </button>
        )}
        <label className="flex cursor-pointer items-center gap-1.5 text-sm">
          <input
            type="checkbox"
            checked={showConnectedOnly}
            onChange={(e) => {
              setShowConnectedOnly(e.target.checked);
              setTimeout(runSimulation, 0);
            }}
            className="rounded"
          />
          <span>Show connected only</span>
        </label>
        <button
          type="button"
          onClick={() => runSimulation()}
          className="rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
        >
          Reset layout
        </button>
      </div>

      <div className="relative flex-1 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
        <svg
          ref={svgRef}
          width="100%"
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMidYMid meet"
        />
        {selected && (
          <div
            className="absolute right-0 top-0 z-50 h-full border-l border-slate-200 bg-white p-4 shadow-xl"
            style={{ width: 240 }}
          >
            <h3 className="font-medium text-slate-900">{selected.label}</h3>
            <span className="mt-1 inline-block rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
              {selected.layer} • {selected.role}
            </span>
            {selected.euRiskLevel && (
              <p className="mt-2 text-sm text-slate-600">Risk: {selected.euRiskLevel}</p>
            )}
            {selected.recordCount != null && (
              <p className="mt-1 text-sm text-slate-600">Records: {selected.recordCount.toLocaleString()}</p>
            )}
            <div className="mt-3 text-sm">
              <p className="font-medium text-slate-700">Connected</p>
              <ul className="mt-1 space-y-1">
                {displayedEdges
                  .filter((e) => e.from === selected.id || e.to === selected.id)
                  .map((e, i) => {
                    const otherId = e.from === selected.id ? e.to : e.from;
                    const other = displayedNodes.find((n) => n.id === otherId);
                    return (
                      <li key={`${e.from}-${e.to}-${i}`} className="text-slate-600">
                        {other?.label ?? otherId} ({e.type})
                      </li>
                    );
                  })}
              </ul>
            </div>
            {selected.link && (
              <Link
                href={selected.link}
                className="mt-4 inline-block text-sm font-medium text-navy-600 hover:underline"
              >
                View details →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
