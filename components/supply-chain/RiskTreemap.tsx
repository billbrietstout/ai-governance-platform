"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import Link from "next/link";

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

const RISK_COLORS: Record<string, string> = {
  red: "#dc2626",
  amber: "#f97316",
  green: "#10b981"
};

function getRiskColor(score: number): string {
  if (score < 40) return RISK_COLORS.red;
  if (score <= 70) return RISK_COLORS.amber;
  return RISK_COLORS.green;
}

function getRiskTier(score: number): "red" | "amber" | "green" {
  if (score < 40) return "red";
  if (score <= 70) return "amber";
  return "green";
}

export function RiskTreemap({
  vendors,
  compact = false,
  onVendorClick
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    vendor: VendorTreemapNode;
  } | null>(null);

  const atRisk = vendors.filter((v) => v.overallScore < 40).length;
  const needsAttention = vendors.filter((v) => v.overallScore >= 40 && v.overallScore <= 70).length;
  const healthy = vendors.filter((v) => v.overallScore > 70).length;

  if (vendors.length === 0) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-500">
        No vendors. Add vendors to see risk scores.
      </div>
    );
  }

  const displayVendors = compact ? vendors.slice(0, 8) : vendors;
  const root = {
    name: "Supply Chain",
    children: displayVendors.map((v) => ({
      ...v,
      value: Math.max(1, v.modelCount ?? 1)
    }))
  } as { name: string; children: (VendorTreemapNode & { value: number })[] };

  const [dimensions, setDimensions] = useState({ width: 600, height: Math.max(compact ? 200 : 300, 200) });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width } = entries[0]?.contentRect ?? { width: 600 };
      setDimensions({ width, height: Math.max(compact ? 200 : 300, 200) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [compact]);

  const { width, height } = dimensions;

  useEffect(() => {
    if (!svgRef.current || displayVendors.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const treemap = d3
      .treemap<{ value?: number; name?: string; children?: unknown[] }>()
      .size([width - 12, height - 12])
      .paddingInner(compact ? 2 : 3)
      .paddingOuter(6)
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
      const w = x1 - x0;
      const h = y1 - y0;
      const showLabel = w > 60 && h > 40;

      const cell = g
        .append("g")
        .attr("transform", `translate(${x0},${y0})`)
        .attr("class", "treemap-cell")
        .style("transform-origin", "center")
        .style("animation", `treemapGrow 0.4s ease-out ${i * 0.03}s forwards`)
        .style("opacity", "0")
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

      if (showLabel) {
        cell
          .append("text")
          .attr("x", w / 2)
          .attr("y", h / 2 - 6)
          .attr("text-anchor", "middle")
          .attr("font-size", 11)
          .attr("fill", "#fff")
          .attr("font-weight", 500)
          .text(v.vendorName.length > 14 ? v.vendorName.slice(0, 12) + "…" : v.vendorName);
        cell
          .append("text")
          .attr("x", w / 2)
          .attr("y", h / 2 + 10)
          .attr("text-anchor", "middle")
          .attr("font-size", 16)
          .attr("fill", "#fff")
          .attr("font-weight", 700)
          .text(v.overallScore);
      } else {
        cell
          .append("text")
          .attr("x", w / 2)
          .attr("y", h / 2 + 4)
          .attr("text-anchor", "middle")
          .attr("font-size", 12)
          .attr("fill", "#fff")
          .text(v.overallScore);
      }
    });

    return () => {
      svg.selectAll("*").remove();
    };
  }, [displayVendors, width, height, compact, onVendorClick]);

  return (
    <div ref={containerRef} className="space-y-3">
      {!compact && (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-slate-600">Total vendors: {vendors.length}</span>
          <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
            At risk (&lt;40): {atRisk}
          </span>
          <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
            Needs attention (40–70): {needsAttention}
          </span>
          <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
            Healthy (&gt;70): {healthy}
          </span>
        </div>
      )}

      <div className="relative">
        <style>{`
          @keyframes treemapGrow {
            from { opacity: 0; transform: scale(0.8); }
            to { opacity: 1; transform: scale(1); }
          }
        `}</style>
        <svg
          ref={svgRef}
          width={width}
          height={height}
          className="w-full"
          style={{ minHeight: height }}
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
            <div>Evidence currency: {tooltip.vendor.evidenceCurrency}%</div>
            <div>Contract aligned: {tooltip.vendor.contractAligned ? "Yes" : "No"}</div>
            <div>Scan coverage: {tooltip.vendor.scanCoverage}%</div>
            <div className="font-medium">Overall: {tooltip.vendor.overallScore}/100</div>
          </div>
          <Link
            href={`/layer5-supply-chain/vendors/${tooltip.vendor.id}?improve=1`}
            className="mt-2 inline-block text-navy-600 hover:underline"
          >
            Improve score →
          </Link>
        </div>
      )}
    </div>
  );
}
