"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { Camera } from "lucide-react";

export type SnapshotPoint = {
  id: string;
  date: Date;
  L1: number;
  L2: number;
  L3: number;
  L4: number;
  L5: number;
  overall: number;
};

type RawSnapshot = {
  id: string;
  createdAt: Date;
  overallScore: number;
  layerScores?: unknown;
};

type Props = {
  snapshots: SnapshotPoint[] | RawSnapshot[];
  onSnapshotClick?: (id: string) => void;
  compact?: boolean;
  emptyStateAction?: React.ReactNode;
};

const LAYER_COLORS: Record<string, string> = {
  L1: "#1D9E75",
  L2: "#534AB7",
  L3: "#D85A30",
  L4: "#185FA5",
  L5: "#5F5E5A"
};

const LAYER_LABELS: Record<string, string> = {
  L1: "Business",
  L2: "Information",
  L3: "Application",
  L4: "Platform",
  L5: "Supply Chain"
};

function normalizeSnapshots(
  raw: { id: string; createdAt: Date; overallScore: number; layerScores?: unknown }[]
): SnapshotPoint[] {
  return raw
    .slice()
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((s) => {
      const scores = (s.layerScores ?? {}) as Record<string, number>;
      return {
        id: s.id,
        date: new Date(s.createdAt),
        L1: scores.L1 ?? 0,
        L2: scores.L2 ?? 0,
        L3: scores.L3 ?? 0,
        L4: scores.L4 ?? 0,
        L5: scores.L5 ?? 0,
        overall: s.overallScore
      };
    });
}

export function ComplianceTrendChart({
  snapshots: rawSnapshots,
  onSnapshotClick,
  compact = false,
  emptyStateAction
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    date: string;
    scores: Record<string, number>;
    overall: number;
    snapshotId: string;
  } | null>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);

  const snapshots = normalizeSnapshots(rawSnapshots as RawSnapshot[]);

  if (snapshots.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 py-12 text-center">
        <Camera className="mx-auto h-10 w-10 text-slate-400" />
        <p className="mt-2 text-sm text-slate-600">Take your first two snapshots to see trend data</p>
        {emptyStateAction && <div className="mt-3">{emptyStateAction}</div>}
      </div>
    );
  }

  const width = 680;
  const height = compact ? 60 : 240;
  const margin = { top: 20, right: 20, bottom: compact ? 8 : 50, left: 40 };

  useEffect(() => {
    if (!svgRef.current || snapshots.length < 2) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const xExtent = d3.extent(snapshots, (d) => d.date) as [Date, Date];
    const xScale = d3.scaleTime().domain(xExtent).range([margin.left, width - margin.right]);
    const yScale = d3.scaleLinear().domain([0, 100]).range([height - margin.bottom, margin.top]);

    const g = svg.append("g");

    if (compact) {
      const line = d3
        .line<SnapshotPoint>()
        .x((d) => xScale(d.date))
        .y((d) => yScale(d.overall))
        .curve(d3.curveMonotoneX);

      g.append("path")
        .datum(snapshots)
        .attr("fill", "none")
        .attr("stroke", "#0f172a")
        .attr("stroke-width", 2)
        .attr("d", line as d3.ValueFn<SVGPathElement, SnapshotPoint[], string | null>);
    } else {
      const layers = ["L1", "L2", "L3", "L4", "L5"] as const;
      const y0 = yScale(0);

      layers.forEach((layer) => {
        const area = d3
          .area<SnapshotPoint>()
          .x((d) => xScale(d.date))
          .y0(y0)
          .y1((d) => yScale(d[layer as keyof SnapshotPoint] as number))
          .curve(d3.curveMonotoneX);

        const line = d3
          .line<SnapshotPoint>()
          .x((d) => xScale(d.date))
          .y((d) => yScale(d[layer as keyof SnapshotPoint] as number))
          .curve(d3.curveMonotoneX);

        g.append("path")
          .datum(snapshots)
          .attr("fill", LAYER_COLORS[layer])
          .attr("fill-opacity", 0.15)
          .attr("d", area as d3.ValueFn<SVGPathElement, SnapshotPoint[], string | null>);

        g.append("path")
          .datum(snapshots)
          .attr("fill", "none")
          .attr("stroke", LAYER_COLORS[layer])
          .attr("stroke-width", 2)
          .attr("d", line as d3.ValueFn<SVGPathElement, SnapshotPoint[], string | null>);
      });

      g.append("path")
        .datum(snapshots)
        .attr("fill", "none")
        .attr("stroke", "#000")
        .attr("stroke-width", 3)
        .attr("stroke-dasharray", "6 4")
        .attr(
          "d",
          d3
            .line<SnapshotPoint>()
            .x((d) => xScale(d.date))
            .y((d) => yScale(d.overall))
            .curve(d3.curveMonotoneX) as d3.ValueFn<SVGPathElement, SnapshotPoint[], string | null>
        );

      g.selectAll(".gridline-y")
        .data([0, 25, 50, 75, 100])
        .join("line")
        .attr("class", "gridline-y")
        .attr("x1", margin.left)
        .attr("x2", width - margin.right)
        .attr("y1", (d) => yScale(d))
        .attr("y2", (d) => yScale(d))
        .attr("stroke", "#e2e8f0")
        .attr("stroke-dasharray", "2 2");

      g.selectAll(".gridline-x")
        .data(snapshots)
        .join("line")
        .attr("class", "gridline-x")
        .attr("x1", (d) => xScale(d.date))
        .attr("x2", (d) => xScale(d.date))
        .attr("y1", margin.top)
        .attr("y2", height - margin.bottom)
        .attr("stroke", "#e2e8f0")
        .attr("stroke-dasharray", "2 2");

      g.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(
          d3
            .axisBottom(xScale)
            .tickValues(snapshots.map((d) => d.date))
            .tickFormat((d) => d3.timeFormat("%b %d")(d as Date))
        )
        .selectAll("text")
        .attr("font-size", 10);

      g.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(yScale).tickValues([0, 25, 50, 75, 100]).tickFormat((d) => `${d}`))
        .selectAll("text")
        .attr("font-size", 10);

      const bisect = d3.bisector((d: SnapshotPoint) => d.date.getTime()).left;

      const overlay = g
        .append("rect")
        .attr("fill", "transparent")
        .attr("x", margin.left)
        .attr("y", margin.top)
        .attr("width", width - margin.left - margin.right)
        .attr("height", height - margin.top - margin.bottom)
        .style("cursor", "crosshair");

      overlay
        .on("mousemove", function (event) {
          const [mx] = d3.pointer(event, this);
          const x = mx + margin.left;
          const date = xScale.invert(x);
          const i = bisect(snapshots, date);
          const d = snapshots[Math.min(i, snapshots.length - 1)];
          if (d) {
            setHoverX(xScale(d.date));
            const tooltipWidth = 140;
            const tooltipHeight = 140;
            let tooltipX = event.clientX + 12;
            let tooltipY = event.clientY + 12;
            if (tooltipX + tooltipWidth > window.innerWidth) {
              tooltipX = event.clientX - tooltipWidth - 12;
            }
            if (tooltipY + tooltipHeight > window.innerHeight) {
              tooltipY = event.clientY - tooltipHeight - 12;
            }
            if (tooltipX < 8) tooltipX = 8;
            if (tooltipY < 8) tooltipY = 8;
            setTooltip({
              x: tooltipX,
              y: tooltipY,
              date: d3.timeFormat("%b %d, %Y")(d.date),
              scores: { L1: d.L1, L2: d.L2, L3: d.L3, L4: d.L4, L5: d.L5 },
              overall: d.overall,
              snapshotId: d.id
            });
          }
        })
        .on("mouseleave", () => {
          setTooltip(null);
          setHoverX(null);
        })
        .on("click", function (event) {
          const [mx] = d3.pointer(event, this);
          const date = xScale.invert(mx + margin.left);
          const i = bisect(snapshots, date);
          const d = snapshots[Math.min(i, snapshots.length - 1)];
          if (d && onSnapshotClick) onSnapshotClick(d.id);
        });

      const hoverLine = g
        .append("line")
        .attr("stroke", "#64748b")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "4 2")
        .attr("y1", margin.top)
        .attr("y2", height - margin.bottom);

      const updateHoverLine = () => {
        if (hoverX != null) {
          hoverLine.attr("x1", hoverX).attr("x2", hoverX).attr("opacity", 1);
        } else {
          hoverLine.attr("opacity", 0);
        }
      };
      updateHoverLine();
    }

    return () => {
      svg.selectAll("*").remove();
    };
  }, [snapshots, compact, onSnapshotClick, hoverX]);

  return (
    <div ref={containerRef} className="relative">
      <svg
        ref={svgRef}
        width="100%"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        overflow="visible"
      />
      {!compact && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-4">
          {(["L1", "L2", "L3", "L4", "L5"] as const).map((l) => (
            <div key={l} className="flex items-center gap-1.5 text-xs">
              <svg width="24" height="4" className="shrink-0">
                <line
                  x1="0"
                  y1="2"
                  x2="24"
                  y2="2"
                  stroke={LAYER_COLORS[l]}
                  strokeWidth="2"
                />
              </svg>
              <span className="text-slate-600">{LAYER_LABELS[l]}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5 text-xs">
            <svg width="24" height="4" className="shrink-0">
              <line
                x1="0"
                y1="2"
                x2="24"
                y2="2"
                stroke="#000"
                strokeWidth="2"
                strokeDasharray="4 2"
              />
            </svg>
            <span className="text-slate-600">Overall</span>
          </div>
        </div>
      )}
      {tooltip && !compact && (
        <div
          className="pointer-events-none fixed z-50 rounded border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <div className="font-medium text-slate-900">{tooltip.date}</div>
          <div className="mt-1 space-y-0.5">
            {(["L1", "L2", "L3", "L4", "L5"] as const).map((l) => (
              <div key={l} className="flex justify-between gap-4">
                <span style={{ color: LAYER_COLORS[l] }}>{LAYER_LABELS[l]}</span>
                <span>{tooltip.scores[l]}%</span>
              </div>
            ))}
          </div>
          <div className="mt-1 border-t border-slate-200 pt-1 font-medium">
            Overall: {tooltip.overall}%
          </div>
        </div>
      )}
    </div>
  );
}

export { normalizeSnapshots };
