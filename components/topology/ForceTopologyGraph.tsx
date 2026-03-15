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
const LAYER_LABELS: Record<string, string> = {
  L1: "Business",
  L2: "Information",
  L3: "Application",
  L4: "Platform",
  L5: "Supply Chain"
};

const NODE_STYLES: Record<string, { color: string; shape: "rect" | "ellipse" | "circle" | "diamond" | "hexagon"; baseSize: number }> = {
  L1: { color: "#1D9E75", shape: "rect", baseSize: 40 },
  L2: { color: "#534AB7", shape: "ellipse", baseSize: 24 },
  L3: { color: "#D85A30", shape: "circle", baseSize: 20 },
  L4: { color: "#185FA5", shape: "diamond", baseSize: 24 },
  L5: { color: "#5F5E5A", shape: "hexagon", baseSize: 22 }
};

const EDGE_STYLES: Record<string, { color: string; dash: string }> = {
  lineage: { color: "#534AB7", dash: "6 4" },
  platform: { color: "#185FA5", dash: "none" },
  model: { color: "#5F5E5A", dash: "none" },
  governance: { color: "#1D9E75", dash: "2 4" }
};

function getNodeSize(node: TopologyNode): number {
  const base = NODE_STYLES[node.layer]?.baseSize ?? 24;
  if (node.layer === "L2" && node.recordCount != null) {
    return Math.min(36, Math.max(16, base + Math.log2(node.recordCount + 1) * 4));
  }
  if (node.layer === "L3" && node.euRiskLevel) {
    const riskSizes: Record<string, number> = { CRITICAL: 28, HIGH: 28, MEDIUM: 20, LOW: 14 };
    return riskSizes[node.euRiskLevel] ?? 20;
  }
  return base;
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

function drawNodeShape(
  sel: d3.Selection<SVGGElement, d3.SimulationNodeDatum & TopologyNode, d3.BaseType, unknown>,
  node: TopologyNode
) {
  const size = getNodeSize(node);
  const style = NODE_STYLES[node.layer];
  const color = style?.color ?? "#64748b";

  sel.selectAll("*").remove();

  if (style?.shape === "rect") {
    const w = size;
    const h = size * 0.6;
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
  } else if (style?.shape === "ellipse") {
    const rx = size;
    const ry = size * 0.6;
    sel
      .append("ellipse")
      .attr("rx", rx)
      .attr("ry", ry)
      .attr("fill", color)
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);
  } else if (style?.shape === "circle") {
    sel
      .append("circle")
      .attr("r", size / 2)
      .attr("fill", color)
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);
  } else if (style?.shape === "diamond") {
    const r = size / 2;
    const pts = `0,-${r} ${r},0 0,${r} -${r},0`;
    sel
      .append("polygon")
      .attr("points", pts)
      .attr("fill", color)
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);
  } else if (style?.shape === "hexagon") {
    const r = size / 2;
    const pts: string[] = [];
    for (let i = 0; i < 6; i++) {
      const a = (i * 60 - 90) * (Math.PI / 180);
      pts.push(`${r * Math.cos(a)},${r * Math.sin(a)}`);
    }
    sel
      .append("polygon")
      .attr("points", pts.join(" "))
      .attr("fill", color)
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);
  } else {
    sel
      .append("circle")
      .attr("r", size / 2)
      .attr("fill", color)
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);
  }
}

export function ForceTopologyGraph({ nodes, edges, onNodeClick, height: heightProp = 600 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [height, setHeight] = useState(heightProp);

  useEffect(() => {
    const el = containerRef.current?.parentElement;
    if (!el) return;
    const updateHeight = () => {
      const h = el.getBoundingClientRect().height;
      if (h > 0) setHeight(h);
    };
    updateHeight();
    const ro = new ResizeObserver(updateHeight);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const simulationRef = useRef<{ stop: () => void; alphaTarget: (v: number) => { restart: () => void } } | null>(null);
  const [selected, setSelected] = useState<TopologyNode | null>(null);
  const [layerFilter, setLayerFilter] = useState<Record<string, boolean>>(
    Object.fromEntries(LAYER_ORDER.map((l) => [l, true]))
  );
  const [edgeFilter, setEdgeFilter] = useState<Record<string, boolean>>({
    lineage: true,
    platform: true,
    model: true,
    governance: true
  });
  const [byLayer, setByLayer] = useState<Record<string, number>>({});
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  const filteredNodes = nodes.filter((n) => layerFilter[n.layer]);
  const filteredEdges = edges.filter((e) => edgeFilter[e.type]);

  const runSimulation = useCallback(() => {
    if (!svgRef.current || filteredNodes.length === 0) return;

    const w = containerRef.current?.clientWidth ?? 800;
    const h = height;
    setDimensions({ width: w, height: h });

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g");
    const bandHeight = h / 5;

    type SimNode = d3.SimulationNodeDatum & TopologyNode & { x: number; y: number };
    const d3Nodes: SimNode[] = filteredNodes.map((n) => ({ ...n, x: w / 2, y: h / 2 }));
    const nodeById = new Map(d3Nodes.map((n) => [n.id, n]));
    const d3Edges = filteredEdges
      .filter((e) => nodeById.has(e.from) && nodeById.has(e.to))
      .map((e) => ({
        ...e,
        source: nodeById.get(e.from)!,
        target: nodeById.get(e.to)!
      }));

    // Layer bands
    const bands = g.append("g").attr("class", "bands");
    for (let i = 0; i < 5; i++) {
      bands
        .append("rect")
        .attr("x", 0)
        .attr("y", i * bandHeight)
        .attr("width", w)
        .attr("height", bandHeight)
        .attr("fill", i % 2 === 0 ? "#f8fafc" : "#f1f5f9")
        .attr("stroke", "none");
      bands
        .append("text")
        .attr("x", 12)
        .attr("y", i * bandHeight + bandHeight / 2 + 4)
        .attr("font-size", 11)
        .attr("fill", "#94a3b8")
        .text(`L${i + 1}`);
    }

    const link = g
      .append("g")
      .attr("class", "links")
      .selectAll<SVGLineElement, (typeof d3Edges)[number]>("line")
      .data(d3Edges)
      .join("line")
      .attr("stroke", (d) => EDGE_STYLES[d.type]?.color ?? "#94a3b8")
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", (d) => EDGE_STYLES[d.type]?.dash ?? "none");

    const node = g
      .append("g")
      .attr("class", "nodes")
      .selectAll<SVGGElement, SimNode>("g")
      .data(d3Nodes)
      .join("g")
      .attr("cursor", "move")
      .style("pointer-events", "all")
      .call(
        d3.drag<SVGGElement, SimNode>()
          .on("start", (event, d) => {
            if (!event.active) simulationRef.current?.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
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
      .scaleExtent([0.3, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });
    svg.call(zoom);

    const simulation = d3
      .forceSimulation(d3Nodes)
      .force("link", d3.forceLink(d3Edges).id((d) => (d as TopologyNode).id).distance(80))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("collide", d3.forceCollide().radius(35))
      .force("x", d3.forceX(w / 2).strength(0.05))
      .force("y", d3.forceY(h / 2).strength(0.05))
      .force(
        "layer",
        (() => {
          const layerIdx = (n: TopologyNode) =>
            Math.max(0, LAYER_ORDER.indexOf((n.layer ?? "L1") as (typeof LAYER_ORDER)[number]));
          return d3.forceY((n) => (layerIdx(n as TopologyNode) + 0.5) * bandHeight).strength(0.15);
        })()
      )
      .alphaDecay(0.05)
      .on("tick", () => {
        link
          .attr("x1", (d) => (d.source as { x: number }).x)
          .attr("y1", (d) => (d.source as { y: number }).y)
          .attr("x2", (d) => (d.target as { x: number }).x)
          .attr("y2", (d) => (d.target as { y: number }).y);
        node.attr("transform", (d) => `translate(${d.x},${d.y})`);
      });

    let tickCount = 0;
    const origTick = simulation.on("tick");
    simulation.on("tick", function () {
      tickCount++;
      if (tickCount >= 300 && simulation.alpha() < 0.01) simulation.stop();
    });

    simulationRef.current = simulation;
  }, [filteredNodes, filteredEdges, height, onNodeClick]);

  useEffect(() => {
    const counts: Record<string, number> = {};
    for (const n of filteredNodes) counts[n.layer] = (counts[n.layer] ?? 0) + 1;
    setByLayer(counts);
  }, [filteredNodes]);

  useEffect(() => {
    runSimulation();
    return () => {
      simulationRef.current?.stop();
    };
  }, [runSimulation]);

  return (
    <div ref={containerRef} className="flex flex-col" style={{ height }}>
      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-slate-200 bg-white px-4 py-2">
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
        <div className="flex gap-2">
          {(["lineage", "platform", "model", "governance"] as const).map((t) => (
            <label key={t} className="flex cursor-pointer items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={edgeFilter[t] ?? true}
                onChange={(e) => setEdgeFilter((p) => ({ ...p, [t]: e.target.checked }))}
                className="rounded"
              />
              {t}
            </label>
          ))}
        </div>
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
          height="100%"
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          preserveAspectRatio="xMidYMid meet"
        />
        {selected && (
          <div
            className="absolute right-0 top-0 h-full border-l border-slate-200 bg-white p-4 shadow-lg"
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
                {filteredEdges
                  .filter((e) => e.from === selected.id || e.to === selected.id)
                  .map((e, i) => {
                    const otherId = e.from === selected.id ? e.to : e.from;
                    const other = filteredNodes.find((n) => n.id === otherId);
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
