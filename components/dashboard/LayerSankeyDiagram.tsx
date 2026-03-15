"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { sankey, sankeyLeft, sankeyLinkHorizontal } from "d3-sankey";

export type LayerNode = {
  id: string;
  label: string;
  assetCount: number;
  complianceScore: number;
  riskCount: number;
  color: string;
};

export type LayerLink = {
  source: string;
  target: string;
  value: number;
};

type Props = {
  layerData: LayerNode[];
  links: LayerLink[];
  layerLinks?: Record<string, string>;
};

const DEFAULT_LAYER_LINKS: Record<string, string> = {
  L1: "/layer1-business",
  L2: "/layer2-information",
  L3: "/layer3-application/assets",
  L4: "/layer4-platform",
  L5: "/layer5-supply-chain"
};

function lightenColor(hex: string, factor: number): string {
  const match = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!match) return hex;
  const r = Math.min(255, parseInt(match[1], 16) + (255 - parseInt(match[1], 16)) * factor);
  const g = Math.min(255, parseInt(match[2], 16) + (255 - parseInt(match[2], 16)) * factor);
  const b = Math.min(255, parseInt(match[3], 16) + (255 - parseInt(match[3], 16)) * factor);
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

export function LayerSankeyDiagram({
  layerData,
  links,
  layerLinks = DEFAULT_LAYER_LINKS
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

  useEffect(() => {
    if (!svgRef.current || layerData.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 680;
    const height = 320;
    const margin = { top: 20, right: 120, bottom: 20, left: 120 };

    const nodes = layerData.map((d) => ({
      ...d,
      fixedValue: Math.max(1, d.assetCount)
    }));

    const sankeyLinks = links.map((l) => ({ source: l.source, target: l.target, value: l.value }));

    const graph = sankey()
      .nodeWidth(20)
      .nodePadding(12)
      .nodeAlign(sankeyLeft)
      .nodeId((d) => (d as LayerNode).id)
      .extent([
        [margin.left, margin.top],
        [width - margin.right, height - margin.bottom]
      ])({ nodes, links: sankeyLinks });

    type LayoutNode = LayerNode & { x0: number; x1: number; y0: number; y1: number };
    type LayoutLink = { source: LayoutNode; target: LayoutNode; value: number };

    const layoutNodes = graph.nodes as LayoutNode[];
    const layoutLinks = graph.links as LayoutLink[];

    const g = svg.append("g");

    // Defs for gradients
    const defs = g.append("defs");
    layoutLinks.forEach((link, i) => {
      const grad = defs
        .append("linearGradient")
        .attr("id", `sankey-grad-${i}`)
        .attr("gradientUnits", "userSpaceOnUse")
        .attr("x1", link.source.x1)
        .attr("x2", link.target.x0);
      grad.append("stop").attr("offset", "0%").attr("stop-color", link.source.color);
      grad.append("stop").attr("offset", "100%").attr("stop-color", link.target.color);
    });

    // Links
    const link = g
      .append("g")
      .selectAll("path")
      .data(layoutLinks)
      .join("path")
      .attr("d", sankeyLinkHorizontal())
      .attr("fill", (_, i) => `url(#sankey-grad-${i})`)
      .attr("fill-opacity", 0.3)
      .attr("cursor", "pointer")
      .style("transition", "fill-opacity 0.2s")
      .on("mouseenter", function (event, d) {
        setTooltip({
          x: event.clientX,
          y: event.clientY,
          text: `${d.value} dependencies flow from ${d.source.label} to ${d.target.label}`
        });
        d3.select(this).attr("fill-opacity", 0.6);
      })
      .on("mousemove", function (event) {
        setTooltip((t) => (t ? { ...t, x: event.clientX, y: event.clientY } : null));
      })
      .on("mouseleave", function () {
        setTooltip(null);
        d3.select(this).attr("fill-opacity", 0.3);
      });

    // Nodes
    const node = g
      .append("g")
      .selectAll("g")
      .data(layoutNodes)
      .join("g")
      .attr("transform", (d) => `translate(${d.x0},${d.y0})`)
      .attr("cursor", "pointer")
      .on("mouseenter", function (_, d) {
        link.attr("fill-opacity", (l) => {
          const s = l.source.id;
          const t = l.target.id;
          return s === d.id || t === d.id ? 0.6 : 0.3;
        });
      })
      .on("mouseleave", function () {
        link.attr("fill-opacity", 0.3);
      })
      .on("click", (_, d) => {
        const href = layerLinks[d.id];
        if (href) window.location.href = href;
      });

    // Node rect (background)
    node
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", 20)
      .attr("height", (d) => d.y1 - d.y0)
      .attr("fill", (d) => d.color)
      .attr("rx", 2);

    // Compliance overlay (inner rect)
    node
      .append("rect")
      .attr("x", 2)
      .attr("y", 2)
      .attr("width", 16)
      .attr("height", (d) => Math.max(0, (d.y1 - d.y0 - 4) * (d.complianceScore / 100)))
      .attr("fill", (d) => lightenColor(d.color, 0.6))
      .attr("rx", 1);

    // Labels left
    node
      .append("text")
      .attr("x", -8)
      .attr("y", (d) => (d.y1 - d.y0) / 2)
      .attr("text-anchor", "end")
      .attr("dominant-baseline", "central")
      .attr("font-size", 11)
      .attr("fill", "var(--color-text-secondary)")
      .text((d) => `${d.label} (${d.assetCount})`);

    // Labels right
    node
      .append("text")
      .attr("x", 28)
      .attr("y", (d) => (d.y1 - d.y0) / 2)
      .attr("text-anchor", "start")
      .attr("dominant-baseline", "central")
      .attr("font-size", 10)
      .attr("fill", "var(--color-text-secondary)")
      .text((d) => {
        const risk = d.riskCount > 0 ? ` • ${d.riskCount} risks` : "";
        return `${d.complianceScore}%${risk}`;
      });
  }, [layerData, links, layerLinks]);

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        width="100%"
        viewBox="0 0 680 320"
        preserveAspectRatio="xMidYMid meet"
        overflow="visible"
      />
      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 rounded border border-slate-200 bg-white px-2 py-1 text-xs shadow-lg"
          style={{
            left: tooltip.x + 12,
            top: tooltip.y + 12,
            transform: "translate(0, 0)"
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
