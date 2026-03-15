"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { MATURITY_LEVEL_LABELS } from "@/lib/maturity/questions";

export type LayerScores = { L1: number; L2: number; L3: number; L4: number; L5: number };

const LAYER_KEYS = ["L1", "L2", "L3", "L4", "L5"] as const;
const AXIS_LABELS = ["Business", "Information", "Application", "Platform", "Supply Chain"];

const MATURITY_COLORS: Record<number, string> = {
  1: "#fbbf24",
  2: "#f97316",
  3: "#3b82f6",
  4: "#8b5cf6",
  5: "#10b981"
};

function getScoreColor(score: number): string {
  if (score >= 5) return MATURITY_COLORS[5];
  if (score >= 4) return MATURITY_COLORS[4];
  if (score >= 3) return MATURITY_COLORS[3];
  if (score >= 2) return MATURITY_COLORS[2];
  return MATURITY_COLORS[1];
}

function getMaturityLevel(score: number): number {
  if (score >= 5) return 5;
  if (score >= 4) return 4;
  if (score >= 3) return 3;
  if (score >= 2) return 2;
  return 1;
}

function getGapToNext(score: number): number {
  const level = getMaturityLevel(score);
  if (level >= 5) return 0;
  const nextFloor = level + 1;
  return Math.round((nextFloor - score) * 10) / 10;
}

type Props = {
  scores: LayerScores;
  targetLevel?: number;
  previousScores?: LayerScores | null;
  size?: number;
  interactive?: boolean;
};

export function MaturityRadarChart({
  scores,
  targetLevel,
  previousScores,
  size = 400,
  interactive = true
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; layer: string; score: number; level: string; gap: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const viewBoxWidth = 460;
    const viewBoxHeight = 440;
    const cx = 230;
    const cy = 225;
    const maxRadius = Math.min(viewBoxWidth, viewBoxHeight) * 0.38;
    const labelRadius = maxRadius + 28;

    const scale = d3.scaleLinear().domain([1, 5]).range([0, maxRadius]);

    // Angles: top = L1, clockwise. 90° - i*72
    const angleForIndex = (i: number) => (90 - i * 72) * (Math.PI / 180);

    const point = (r: number, i: number) => {
      const a = angleForIndex(i);
      return { x: cx + r * Math.cos(a), y: cy - r * Math.sin(a) };
    };

    const polygonPath = (s: LayerScores) => {
      const pts = LAYER_KEYS.map((k, i) => point(scale(s[k] ?? 1), i));
      return pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";
    };

    const g = svg.append("g");

    // Grid rings at M1-M5
    for (let ring = 1; ring <= 5; ring++) {
      const r = scale(ring);
      g.append("circle")
        .attr("cx", cx)
        .attr("cy", cy)
        .attr("r", r)
        .attr("fill", "none")
        .attr("stroke", "#e2e8f0")
        .attr("stroke-width", 0.5);

      // Ring label on right axis (index 1 = top-right)
      const p = point(r, 1);
      g.append("text")
        .attr("x", p.x + 8)
        .attr("y", p.y)
        .attr("text-anchor", "start")
        .attr("font-size", 9)
        .attr("fill", "#94a3b8")
        .text(`M${ring}`);
    }

    // Axes
    LAYER_KEYS.forEach((_, i) => {
      const end = point(maxRadius, i);
      g.append("line")
        .attr("x1", cx)
        .attr("y1", cy)
        .attr("x2", end.x)
        .attr("y2", end.y)
        .attr("stroke", "#cbd5e1")
        .attr("stroke-width", 0.5);
    });

    // Target level ring
    if (targetLevel != null && targetLevel >= 1 && targetLevel <= 5) {
      const r = scale(targetLevel);
      g.append("circle")
        .attr("cx", cx)
        .attr("cy", cy)
        .attr("r", r)
        .attr("fill", "none")
        .attr("stroke", "#3b82f6")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "4 4");
    }

    // Previous scores polygon (if provided)
    if (previousScores && interactive) {
      const fillColor = getScoreColor(
        Math.min(
          previousScores.L1 ?? 1,
          previousScores.L2 ?? 1,
          previousScores.L3 ?? 1,
          previousScores.L4 ?? 1,
          previousScores.L5 ?? 1
        )
      );
      g.append("path")
        .attr("d", polygonPath(previousScores))
        .attr("fill", fillColor)
        .attr("fill-opacity", 0.12)
        .attr("stroke", fillColor)
        .attr("stroke-width", 1)
        .attr("stroke-opacity", 0.5);
    }

    // Current score polygon
    const minScore = Math.min(
      scores.L1 ?? 1,
      scores.L2 ?? 1,
      scores.L3 ?? 1,
      scores.L4 ?? 1,
      scores.L5 ?? 1
    );
    const fillColor = getScoreColor(minScore);

    g.append("path")
      .attr("d", polygonPath(scores))
      .attr("fill", fillColor)
      .attr("fill-opacity", 0.25)
      .attr("stroke", fillColor)
      .attr("stroke-width", 1.5);

    // Vertex dots
    LAYER_KEYS.forEach((k, i) => {
      const s = scores[k] ?? 1;
      const p = point(scale(s), i);
      const dotSize = Math.max(3, 4 + (s - 1) * 0.5);
      g.append("circle")
        .attr("cx", p.x)
        .attr("cy", p.y)
        .attr("r", dotSize)
        .attr("fill", getScoreColor(s))
        .attr("stroke", "#fff")
        .attr("stroke-width", 1);
    });

    // Axis labels — positioned beyond vertices, always horizontal
    const getLabelPos = (p: { x: number; y: number }, i: number) => {
      switch (i) {
        case 0: return { x: cx, y: p.y - 20, anchor: "middle" as const }; // Business: top center
        case 1: return { x: p.x + 36, y: p.y - 8, anchor: "start" as const }; // Information: upper right
        case 2: return { x: p.x + 36, y: p.y + 8, anchor: "start" as const }; // Application: lower right
        case 3: return { x: p.x - 36, y: p.y + 8, anchor: "end" as const }; // Platform: lower left
        case 4: return { x: p.x - 36, y: p.y - 8, anchor: "end" as const }; // Supply Chain: upper left
        default: return { x: p.x, y: p.y, anchor: "middle" as const };
      }
    };
    LAYER_KEYS.forEach((k, i) => {
      const p = point(labelRadius, i);
      const { x, y, anchor } = getLabelPos(p, i);
      g.append("text")
        .attr("x", x)
        .attr("y", y)
        .attr("text-anchor", anchor)
        .attr("dominant-baseline", "central")
        .attr("font-size", 12)
        .attr("fill", "var(--color-text-secondary)")
        .text(AXIS_LABELS[i]);
    });

    // Hover regions (invisible rectangles along each axis)
    if (interactive) {
      LAYER_KEYS.forEach((_, i) => {
        const end = point(labelRadius + 20, i);
        const midX = (cx + end.x) / 2;
        const midY = (cy + end.y) / 2;
        const w = 40;
        const h = 60;

        const zone = g
          .append("rect")
          .attr("x", midX - w / 2)
          .attr("y", midY - h / 2)
          .attr("width", w)
          .attr("height", h)
          .attr("fill", "transparent")
          .attr("cursor", "pointer")
          .style("pointer-events", "all");

        zone
          .on("mouseenter", function (event) {
            const score = scores[LAYER_KEYS[i]] ?? 1;
            const level = getMaturityLevel(score);
            const rect = containerRef.current?.getBoundingClientRect();
            setTooltip({
              x: rect ? event.clientX - rect.left : event.offsetX,
              y: rect ? event.clientY - rect.top : event.offsetY,
              layer: AXIS_LABELS[i],
              score,
              level: MATURITY_LEVEL_LABELS[level] ?? `M${level}`,
              gap: getGapToNext(score)
            });
          })
          .on("mousemove", function (event) {
            const rect = containerRef.current?.getBoundingClientRect();
            setTooltip((t) =>
              t ? { ...t, x: rect ? event.clientX - rect.left : event.offsetX, y: rect ? event.clientY - rect.top : event.offsetY } : null
            );
          })
          .on("mouseleave", function () {
            setTooltip(null);
          });
      });
    }

    return () => {
      svg.selectAll("*").remove();
    };
  }, [scores, targetLevel, previousScores, size, interactive]);

  const viewBoxWidth = 460;
  const viewBoxHeight = 440;

  return (
    <div ref={containerRef} className="relative inline-block">
      <svg
        ref={svgRef}
        width="100%"
        height={viewBoxHeight}
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        preserveAspectRatio="xMidYMid meet"
        overflow="visible"
      />
      {interactive && tooltip && (
        <div
          className="pointer-events-none absolute z-10 rounded border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg"
          style={{
            left: tooltip.x + 12,
            top: tooltip.y + 12,
            color: "var(--color-text-primary)"
          }}
        >
          <div className="font-medium">{tooltip.layer}</div>
          <div className="mt-0.5 text-slate-600">
            {tooltip.score.toFixed(1)} — {tooltip.level}
          </div>
          {tooltip.gap > 0 && (
            <div className="mt-0.5 text-slate-500">Gap to next: {tooltip.gap.toFixed(1)}</div>
          )}
        </div>
      )}
    </div>
  );
}
