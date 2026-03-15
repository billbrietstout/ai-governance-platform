"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

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
  const [zoomExtent, setZoomExtent] = useState<[Date, Date] | null>(null);

  const snapshots = normalizeSnapshots(rawSnapshots as RawSnapshot[]);

  if (snapshots.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 py-12 text-center">
        <p className="text-sm text-slate-600">Take your first two snapshots to see trend data</p>
        {emptyStateAction && <div className="mt-3">{emptyStateAction}</div>}
      </div>
    );
  }

  const width = 680;
  const height = compact ? 80 : 260;
  const margin = { top: 20, right: 20, bottom: compact ? 20 : 70, left: 40 };

  useEffect(() => {
    if (!svgRef.current || snapshots.length < 2) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const xExtent = d3.extent(snapshots, (d) => d.date) as [Date, Date];
    const xDomain = zoomExtent ?? xExtent;
    const xScale = d3.scaleTime().domain(xDomain).range([margin.left, width - margin.right]);

    const useLineChart = snapshots.length <= 3 || compact;

    const g = svg.append("g");

    if (!useLineChart && !compact) {
      const layers = ["L1", "L2", "L3", "L4", "L5"] as const;
      const stackData = snapshots.map((d) => {
        const total = d.L1 + d.L2 + d.L3 + d.L4 + d.L5;
        const norm = total > 0 ? 100 / total : 20;
        return {
          ...d,
          L1n: (d.L1 * norm) / 5,
          L2n: (d.L2 * norm) / 5,
          L3n: (d.L3 * norm) / 5,
          L4n: (d.L4 * norm) / 5,
          L5n: (d.L5 * norm) / 5
        };
      });

      const stack = d3
        .stack<typeof stackData[0]>()
        .keys(["L1n", "L2n", "L3n", "L4n", "L5n"])
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetNone);

      const stacked = stack(stackData);
      const yScale = d3.scaleLinear().domain([0, 100]).range([height - margin.bottom, margin.top]);

      const area = d3
        .area<d3.SeriesPoint<typeof stackData[0]>>()
        .x((d) => xScale((d.data as typeof stackData[0]).date))
        .y0((d) => yScale(d[0]))
        .y1((d) => yScale(d[1]))
        .curve(d3.curveMonotoneX);

      layers.forEach((layer, i) => {
        const key = `${layer}n`;
        g.append("path")
          .datum(stacked[i])
          .attr("fill", LAYER_COLORS[layer])
          .attr("fill-opacity", 0.7)
          .attr("d", area as d3.ValueFn<SVGPathElement, unknown, string | null>);
      });
    } else {
      const yScaleLine = d3.scaleLinear().domain([0, 100]).range([height - margin.bottom, margin.top]);
      const line = d3
        .line<SnapshotPoint>()
        .x((d) => xScale(d.date))
        .y((d) => yScaleLine(d.overall))
        .curve(d3.curveMonotoneX);

      g.append("path")
        .datum(snapshots)
        .attr("fill", "none")
        .attr("stroke", "#1e3a5f")
        .attr("stroke-width", compact ? 2 : 2)
        .attr("d", line as d3.ValueFn<SVGPathElement, SnapshotPoint[], string | null>);

      if (!compact) {
        const layers = ["L1", "L2", "L3", "L4", "L5"] as const;
        layers.forEach((layer) => {
          const lineLayer = d3
            .line<SnapshotPoint>()
            .x((d) => xScale(d.date))
            .y((d) => yScaleLine(d[layer as keyof SnapshotPoint] as number))
            .curve(d3.curveMonotoneX);
          g.append("path")
            .datum(snapshots)
            .attr("fill", "none")
            .attr("stroke", LAYER_COLORS[layer])
            .attr("stroke-width", 1.5)
            .attr("stroke-opacity", 0.7)
            .attr("d", lineLayer as d3.ValueFn<SVGPathElement, SnapshotPoint[], string | null>);
        });
      }
    }

    const yScale = d3.scaleLinear().domain([0, 100]).range([height - margin.bottom, margin.top]);

    if (!compact) {
      g.append("path")
        .datum(snapshots)
        .attr("fill", "none")
        .attr("stroke", "#1e3a5f")
        .attr("stroke-width", 3)
        .attr("stroke-opacity", 0.9)
        .attr(
          "d",
          d3
            .line<SnapshotPoint>()
            .x((d) => xScale(d.date))
            .y((d) => yScale(d.overall))
            .curve(d3.curveMonotoneX) as d3.ValueFn<SVGPathElement, SnapshotPoint[], string | null>
        );

      g.selectAll(".gridline")
        .data([0, 25, 50, 75, 100])
        .join("line")
        .attr("class", "gridline")
        .attr("x1", margin.left)
        .attr("x2", width - margin.right)
        .attr("y1", (d) => yScale(d))
        .attr("y2", (d) => yScale(d))
        .attr("stroke", "#e2e8f0")
        .attr("stroke-dasharray", "2 2");

      g.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(
          d3
            .axisBottom(xScale)
            .ticks(6)
            .tickFormat((d) => d3.timeFormat("%b %d")(d as Date))
        )
        .selectAll("text")
        .attr("font-size", 10);

      g.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(yScale).ticks(5).tickFormat((d) => `${d}`))
        .selectAll("text")
        .attr("font-size", 10);
    }

    const bisect = d3.bisector((d: SnapshotPoint) => d.date.getTime()).left;

    const overlay = g
      .append("rect")
      .attr("fill", "transparent")
      .attr("x", margin.left)
      .attr("y", margin.top)
      .attr("width", width - margin.left - margin.right)
      .attr("height", height - margin.top - margin.bottom)
      .style("cursor", compact ? "default" : "crosshair");

    if (!compact) {
      overlay
        .on("mousemove", function (event) {
          const [mx] = d3.pointer(event, this);
          const x = mx + margin.left;
          const date = xScale.invert(x);
          const i = bisect(snapshots, date);
          const d = snapshots[Math.min(i, snapshots.length - 1)];
          if (d) {
            setHoverX(xScale(d.date));
            const rect = containerRef.current?.getBoundingClientRect();
            setTooltip({
              x: event.clientX + 12,
              y: event.clientY + 12,
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

      const brushTop = height - margin.bottom - 18;
      const brush = d3
        .brushX()
        .extent([
          [margin.left, brushTop],
          [width - margin.right, height - margin.bottom]
        ])
        .on("end", (event) => {
          const selection = event.selection;
          if (selection) {
            const [x0, x1] = selection;
            setZoomExtent([xScale.invert(x0), xScale.invert(x1)]);
          } else {
            setZoomExtent(null);
          }
        });
      g.append("g").attr("class", "brush").call(brush);

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
  }, [snapshots, compact, onSnapshotClick, hoverX, zoomExtent]);

  return (
    <div ref={containerRef} className="relative">
      {zoomExtent && !compact && (
        <button
          type="button"
          onClick={() => setZoomExtent(null)}
          className="absolute right-0 top-0 rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
        >
          Reset zoom
        </button>
      )}
      <svg
        ref={svgRef}
        width="100%"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        overflow="visible"
      />
      {!compact && (
        <div className="mt-2 flex flex-wrap gap-4">
          {(["L1", "L2", "L3", "L4", "L5"] as const).map((l) => (
            <div key={l} className="flex items-center gap-1.5 text-xs">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: LAYER_COLORS[l], opacity: 0.7 }}
              />
              <span className="text-slate-600">{LAYER_LABELS[l]}</span>
            </div>
          ))}
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
