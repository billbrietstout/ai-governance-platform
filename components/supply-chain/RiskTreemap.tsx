"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

const WIDTH = 900;
const HEIGHT = 320;

export type VendorTreemapNode = {
  id: string;
  vendorName: string;
  overallScore: number;
  evidenceCurrency: number;
  contractAligned: boolean | null;
  scanCoverage: number;
  modelCount: number;
  cosaiLayer?: string | null;
};

type Props = {
  vendors: VendorTreemapNode[];
  compact?: boolean;
  onVendorClick?: (vendorId: string) => void;
};

export const RISK_COLORS: Record<string, string> = {
  red: "#dc2626",
  amber: "#f97316",
  green: "#10b981"
};

function getRiskColor(score: number): string {
  if (score < 40) return RISK_COLORS.red;
  if (score <= 70) return RISK_COLORS.amber;
  return RISK_COLORS.green;
}

export function RiskTreemap({
  vendors,
  compact = false,
  onVendorClick
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    vendor: VendorTreemapNode;
  } | null>(null);

  const displayVendors = compact ? vendors.slice(0, 8) : vendors;
  const totalValue = displayVendors.reduce((s, v) => s + Math.max(1, v.modelCount ?? 1), 0);
  const root = {
    name: "Supply Chain",
    value: totalValue,
    children: displayVendors.map((v) => ({
      ...v,
      value: Math.max(1, v.modelCount ?? 1)
    }))
  } as { name: string; value: number; children: (VendorTreemapNode & { value: number })[] };

  useEffect(() => {
    if (!svgRef.current || displayVendors.length === 0) return;

    try {
      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();

      const treemap = d3
        .treemap<{ value?: number; name?: string; children?: unknown[] }>()
        .size([WIDTH, HEIGHT])
        .padding(3)
        .round(true);

    const hierarchy = d3
      .hierarchy(root)
      .sum((d) => ("children" in d && d.children ? 0 : ((d as { value?: number }).value ?? 1)));

    const tree = treemap(hierarchy as d3.HierarchyNode<{ value?: number; name?: string; children?: unknown[] }>);
    const leaves = tree.leaves().filter((d) => d.data && "id" in d.data);

    const g = svg.append("g");

    leaves.forEach((node, i) => {
      const d = node.data as VendorTreemapNode & { value: number };
      const v = displayVendors.find((x) => x.id === d.id);
      if (!v) return;

      const color = getRiskColor(v.overallScore);
      const { x0, y0, x1, y1 } = node;
      let w = x1 - x0;
      let h = y1 - y0;
      if (w < 1 || h < 1) {
        console.warn("[RiskTreemap] Zero-size rect for vendor", v.vendorName, { w, h });
        w = Math.max(10, w);
        h = Math.max(10, h);
      }
      const showLabels = h >= 40;

      const cell = g
        .append("g")
        .attr("transform", `translate(${x0},${y0})`)
        .attr("class", "treemap-cell")
        .style("opacity", 0)
        .attr("cursor", "pointer")
        .on("click", () => {
          if (onVendorClick) onVendorClick(v.id);
          else window.location.href = `/layer5-supply-chain/vendors/${v.id}?improve=1`;
        })
        .on("mouseenter", (event) => {
          setTooltip({
            x: event.clientX + 12,
            y: event.clientY + 12,
            vendor: v
          });
        })
        .on("mouseleave", () => setTooltip(null));

      cell
        .append("rect")
        .attr("width", w)
        .attr("height", h)
        .attr("fill", color)
        .attr("stroke", "#fff")
        .attr("stroke-width", 1)
        .attr("rx", 2);

      if (showLabels) {
        cell
          .append("text")
          .attr("x", w / 2)
          .attr("y", 14)
          .attr("text-anchor", "middle")
          .attr("font-size", 11)
          .attr("fill", "#fff")
          .attr("font-weight", 500)
          .text(v.vendorName.length > 16 ? v.vendorName.slice(0, 14) + "…" : v.vendorName);
        cell
          .append("text")
          .attr("x", w / 2)
          .attr("y", h / 2 + 6)
          .attr("text-anchor", "middle")
          .attr("font-size", 20)
          .attr("fill", "#fff")
          .attr("font-weight", 700)
          .text(v.overallScore);
      }

      cell
        .transition()
        .delay(i * 30)
        .duration(300)
        .style("opacity", 1);
    });
    } catch (err) {
      console.error("[RiskTreemap] D3 rendering error:", err);
    }

    return () => {
      if (svgRef.current) d3.select(svgRef.current).selectAll("*").remove();
    };
  }, [displayVendors, onVendorClick]);

  if (vendors.length === 0) {
    return (
      <div className="flex min-h-[280px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-500">
        No vendors. Add vendors to see risk scores.
      </div>
    );
  }

  const minHeight = 280;
  return (
    <div className="space-y-3">
      <div className="relative w-full overflow-auto" style={{ minHeight }}>
        <svg
          ref={svgRef}
          width="100%"
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          preserveAspectRatio="xMidYMid meet"
          className="w-full"
          style={{ minHeight: HEIGHT }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
        <span className="flex items-center gap-1.5">
          <span
            className="h-3 w-3 rounded"
            style={{ backgroundColor: RISK_COLORS.red }}
          />
          &lt;40 At risk
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="h-3 w-3 rounded"
            style={{ backgroundColor: RISK_COLORS.amber }}
          />
          40–70 Needs attention
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="h-3 w-3 rounded"
            style={{ backgroundColor: RISK_COLORS.green }}
          />
          &gt;70 Healthy
        </span>
      </div>

      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 w-56 rounded border border-slate-200 bg-white p-3 text-xs shadow-lg"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <div className="font-medium text-slate-900">{tooltip.vendor.vendorName}</div>
          <div className="mt-2 space-y-0.5 text-slate-600">
            <div>Evidence: {tooltip.vendor.evidenceCurrency}%</div>
            <div>Contract aligned: {tooltip.vendor.contractAligned ? "Yes" : "No"}</div>
            <div>Scan coverage: {tooltip.vendor.scanCoverage}%</div>
            <div className="font-medium">Overall: {tooltip.vendor.overallScore}/100</div>
          </div>
        </div>
      )}
    </div>
  );
}
