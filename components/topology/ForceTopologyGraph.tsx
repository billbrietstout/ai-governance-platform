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

  if (node.layer === "L1") {
    sel
      .append("rect")
      .attr("x", -40)
      .attr("y", -18)
      .attr("width", 80)
      .attr("height", 36)
      .attr("rx", 4)
      .attr("fill", color)
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);
  } else if (node.layer === "L2") {
    sel
      .append("ellipse")
      .attr("rx", 50)
      .attr("ry", 20)
      .attr("fill", color)
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);
  } else if (node.layer === "L3") {
    const r = getNodeRadius(node);
    sel
      .append("circle")
      .attr("r", r)
      .attr("fill", color)
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);
  } else if (node.layer === "L4" || node.layer === "L5") {
    sel
      .append("rect")
      .attr("x", -40)
      .attr("y", -16)
      .attr("width", 80)
      .attr("height", 32)
      .attr("rx", 4)
      .attr("fill", color)
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);
  } else {
    sel
      .append("circle")
      .attr("r", 18)
      .attr("fill", color)
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);
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

  const filteredNodes = nodes.filter((n) => layerFilter[n.layer]);
  const filteredEdges = edges.filter(
    (e) =>
      layerFilter[nodes.find((n) => n.id === e.from)?.layer ?? "L1"] &&
      layerFilter[nodes.find((n) => n.id === e.to)?.layer ?? "L1"]
  );

  const runSimulation = useCallback(() => {
    if (!svgRef.current || !containerRef.current || filteredNodes.length === 0) return;

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
        .attr("fill", "#94a3b8")
        .text(`L${i + 1}`);
    }

    type SimNodeExt = SimNode & { x: number; y: number };
    const d3Nodes: SimNodeExt[] = filteredNodes.map((n) => ({
      ...n,
      x: w / 2,
      y: layerY(LAYER_INDEX[n.layer] ?? 0)
    }));
    const nodeById = new Map(d3Nodes.map((n) => [n.id, n]));
    const d3Edges = filteredEdges
      .filter((e) => nodeById.has(e.from) && nodeById.has(e.to))
      .map((e) => ({
        ...e,
        source: nodeById.get(e.from)!,
        target: nodeById.get(e.to)!
      }));

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

    const simulation = d3
      .forceSimulation<SimNodeExt>(d3Nodes)
      .force("link", d3.forceLink(d3Edges).id((d) => (d as TopologyNode).id).distance(100))
      .force("charge", d3.forceManyBody().strength(-150))
      .force("collide", d3.forceCollide().radius(35))
      .force(
        "y",
        d3.forceY<SimNodeExt>((d) => layerY(LAYER_INDEX[d.layer] ?? 0)).strength(0.3)
      )
      .force("x", d3.forceX(w / 2).strength(0.05))
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
            const ids = getConnectedIds(filteredEdges, sel.id);
            return ids.has((d.source as SimNodeExt).id) && ids.has((d.target as SimNodeExt).id) ? 1 : 0.15;
          });
        node.attr("transform", (d) => `translate(${d.x},${d.y})`).attr("opacity", (d) => {
          const sel = selectedRef.current;
          if (!sel) return 1;
          const ids = getConnectedIds(filteredEdges, sel.id);
          return ids.has(d.id) ? 1 : 0.2;
        });
      });

    simulationRef.current = simulation;
  }, [filteredNodes, filteredEdges, height, onNodeClick]);

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
  for (const n of filteredNodes) byLayer[n.layer] = (byLayer[n.layer] ?? 0) + 1;

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
