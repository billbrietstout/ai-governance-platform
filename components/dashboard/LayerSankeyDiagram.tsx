"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

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

const LAYER_COLORS: Record<string, string> = {
  L1: "#1D9E75",
  L2: "#534AB7",
  L3: "#D85A30",
  L4: "#185FA5",
  L5: "#5F5E5A"
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

export function LayerSankeyDiagram({ layerData, links, layerLinks = DEFAULT_LAYER_LINKS }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

  useEffect(() => {
    if (!svgRef.current || layerData.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 680;
    const height = 200;
    const nodeWidth = 24;
    const nodeHeight = 52;
    const xStart = 60;
    const xEnd = 620;
    const totalNodeWidth = layerData.length * nodeWidth;
    const totalGap = xEnd - xStart - totalNodeWidth;
    const gap = layerData.length > 1 ? totalGap / (layerData.length - 1) : 0;

    const normalizedLinks = links.map((l) => ({
      ...l,
      value: Math.max(10, l.value)
    }));

    const maxLinkValue = Math.max(...normalizedLinks.map((l) => l.value), 1);

    type LayoutNode = LayerNode & {
      x: number;
      y: number;
      nodeHeight: number;
    };

    const layoutNodes: LayoutNode[] = layerData.map((d, i) => {
      const x = xStart + i * (nodeWidth + gap);
      const y = height / 2 - nodeHeight / 2;
      const color = d.color || LAYER_COLORS[d.id] || "#64748b";
      return {
        ...d,
        color,
        x,
        y,
        nodeHeight
      };
    });

    const nodeById = new Map(layoutNodes.map((n) => [n.id, n]));

    const g = svg.append("g");

    const linkPath = (source: LayoutNode, target: LayoutNode) => {
      const x1 = source.x + nodeWidth;
      const x2 = target.x;
      const y1 = source.y + source.nodeHeight / 2;
      const y2 = target.y + target.nodeHeight / 2;
      const cx = (x1 + x2) / 2;
      return `M ${x1},${y1} C ${cx},${y1} ${cx},${y2} ${x2},${y2}`;
    };

    const layoutLinks = normalizedLinks
      .map((l) => {
        const source = nodeById.get(l.source);
        const target = nodeById.get(l.target);
        if (!source || !target) return null;
        return { source, target, value: l.value };
      })
      .filter((l): l is { source: LayoutNode; target: LayoutNode; value: number } => l !== null);

    const maxLinkHeight = nodeHeight - 8;
    const linkScale = d3.scaleLinear().domain([0, maxLinkValue]).range([4, maxLinkHeight]);

    layoutLinks.forEach((link) => {
      const strokeWidth = Math.min(maxLinkHeight, linkScale(link.value));
      const path = g
        .append("path")
        .attr("d", linkPath(link.source, link.target))
        .attr("fill", "none")
        .attr("stroke", link.source.color)
        .attr("stroke-opacity", 0.3)
        .attr("stroke-width", strokeWidth)
        .attr("stroke-linecap", "round")
        .attr("cursor", "pointer")
        .style("transition", "stroke-opacity 0.2s")
        .on("mouseenter", function (event) {
          setTooltip({
            x: event.clientX,
            y: event.clientY,
            text: `${link.value} dependencies flow from ${link.source.label} to ${link.target.label}`
          });
          d3.select(this).attr("stroke-opacity", 0.6);
        })
        .on("mousemove", function (event) {
          setTooltip((t) => (t ? { ...t, x: event.clientX, y: event.clientY } : null));
        })
        .on("mouseleave", function () {
          setTooltip(null);
          d3.select(this).attr("stroke-opacity", 0.3);
        });
    });

    const node = g
      .append("g")
      .selectAll("g")
      .data(layoutNodes)
      .join("g")
      .attr("transform", (d) => `translate(${d.x},${d.y})`)
      .attr("cursor", "pointer")
      .on("mouseenter", function (_, d) {
        g.selectAll("path").attr("stroke-opacity", (_, i) => {
          const l = layoutLinks[i];
          return l && (l.source.id === d.id || l.target.id === d.id) ? 0.6 : 0.3;
        });
      })
      .on("mouseleave", function () {
        g.selectAll("path").attr("stroke-opacity", 0.3);
      })
      .on("click", (_, d) => {
        const href = layerLinks[d.id];
        if (href) window.location.href = href;
      });

    node
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", nodeWidth)
      .attr("height", nodeHeight)
      .attr("fill", (d) => d.color)
      .attr("rx", 2);

    node
      .append("rect")
      .attr("x", 2)
      .attr("y", 2)
      .attr("width", (d) => Math.max(0, (nodeWidth - 4) * (d.complianceScore / 100)))
      .attr("height", nodeHeight - 4)
      .attr("fill", (d) => lightenColor(d.color, 0.6))
      .attr("rx", 1);

    const labelAboveY = -12;
    const labelBelowY = nodeHeight + 18;

    node
      .append("text")
      .attr("x", nodeWidth / 2)
      .attr("y", labelAboveY)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("font-size", 11)
      .attr("fill", "#475569")
      .text((d) => d.label);

    node
      .append("text")
      .attr("x", nodeWidth / 2)
      .attr("y", labelBelowY)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("font-size", 10)
      .attr("fill", "#64748b")
      .text((d) => {
        const risk = d.riskCount > 0 ? ` • ${d.riskCount} risks` : "";
        return `${d.assetCount} assets • ${d.complianceScore}%${risk}`;
      });
  }, [layerData, links, layerLinks]);

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        width="100%"
        height="200"
        viewBox="0 0 680 200"
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
