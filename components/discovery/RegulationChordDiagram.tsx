"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { buildChordMatrix, type RegulationForChord } from "@/lib/discovery/regulation-domains";

const JURISDICTION_COLORS: Record<string, string> = {
  EU: "#185FA5",
  US: "#D85A30",
  US_STATE: "#EF9F27",
  US_LOCAL: "#EF9F27",
  INTERNATIONAL: "#1D9E75"
};

function getJurisdictionColor(jurisdiction: string): string {
  const normalized = jurisdiction?.toUpperCase().replace(/-/g, "_") ?? "";
  return JURISDICTION_COLORS[normalized] ?? JURISDICTION_COLORS.INTERNATIONAL;
}

function lightenColor(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.round(r + (255 - r) * factor)}, ${Math.round(g + (255 - g) * factor)}, ${Math.round(b + (255 - b) * factor)})`;
}

type Props = {
  regulations: RegulationForChord[];
  /** If true, show "+ X more" when 7+ regulations (top 6 shown) */
  showMoreNote?: boolean;
};

export function RegulationChordDiagram({ regulations, showMoreNote = true }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredChord, setHoveredChord] = useState<{ source: number; target: number } | null>(null);
  const [hoveredArc, setHoveredArc] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; shared: number; regA: string; regB: string } | null>(null);

  // 7+ regulations: reduce to top 6 by mandatory status (mandatory first, then likely, then recommended)
  const displayRegs = useMemo(() => {
    const sorted = [...regulations].sort((a, b) => {
      const order = (r: RegulationForChord) =>
        r.mandatory || r.applicability === "MANDATORY" ? 0 : r.applicability === "LIKELY_APPLICABLE" ? 1 : 2;
      return order(a) - order(b);
    });
    return sorted.length > 6 ? sorted.slice(0, 6) : sorted;
  }, [regulations]);
  const moreCount = regulations.length - displayRegs.length;

  useEffect(() => {
    if (!svgRef.current || displayRegs.length < 2) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 400;
    const height = 400;
    const innerRadius = Math.min(width, height) * 0.35;
    const outerRadius = Math.min(width, height) * 0.42;

    const { matrix, sharedByPair } = buildChordMatrix(displayRegs);

    const chord = d3
      .chord()
      .padAngle(0.04)
      .sortSubgroups(d3.descending);

    const arc = d3
      .arc<d3.ChordGroup>()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius);

    const ribbon = d3
      .ribbon<d3.Chord, d3.ChordSubgroup>()
      .radius(innerRadius - 1);

    const chordData = chord(matrix);

    const g = svg.append("g").attr("transform", `translate(${width / 2},${height / 2})`);

    // Arcs
    const arcGroups = g
      .append("g")
      .selectAll("g")
      .data(chordData.groups)
      .join("g")
      .attr("class", "arc-group");

    arcGroups
      .append("path")
      .attr("fill", (d) => getJurisdictionColor(displayRegs[d.index]?.jurisdiction ?? ""))
      .attr("stroke", (d) => d3.color(getJurisdictionColor(displayRegs[d.index]?.jurisdiction ?? ""))?.darker(0.5)?.toString() ?? "#333")
      .attr("stroke-width", 1)
      .attr("d", arc as (d: d3.ChordGroup) => string)
      .style("opacity", (d) => {
        if (hoveredArc === null) return 1;
        return hoveredArc === d.index ? 1 : 0.35;
      })
      .on("mouseenter", function (_event, d) {
        setHoveredArc(d.index);
      })
      .on("mouseleave", function () {
        setHoveredArc(null);
      });

    // Arc labels
    arcGroups
      .append("text")
      .attr("transform", (d) => {
        const angle = (d.startAngle + d.endAngle) / 2;
        const x = (outerRadius + 20) * Math.cos(angle - Math.PI / 2);
        const y = (outerRadius + 20) * Math.sin(angle - Math.PI / 2);
        const rot = (angle * 180) / Math.PI;
        return `translate(${x},${y}) rotate(${rot})`;
      })
      .attr("text-anchor", "middle")
      .attr("font-size", 10)
      .attr("font-weight", 500)
      .attr("fill", "#374151")
      .text((d) => regulations[d.index]?.code ?? `Reg ${d.index}`)
      .style("pointer-events", "none");

    // Chords (ribbons) - filter to avoid duplicate ribbons for symmetric matrix
    const ribbons = g
      .append("g")
      .selectAll("path")
      .data(chordData.filter((c) => c.source.index < c.target.index))
      .join("path")
      .attr("fill", (d) => {
        const color = getJurisdictionColor(displayRegs[d.source.index]?.jurisdiction ?? "");
        return lightenColor(color, 0.6);
      })
      .attr("stroke", (d) => getJurisdictionColor(displayRegs[d.source.index]?.jurisdiction ?? ""))
      .attr("stroke-width", 0.5)
      .attr("d", ribbon as (d: d3.Chord) => string)
      .style("opacity", (d) => {
        const isHoveredChord =
          hoveredChord &&
          ((d.source.index === hoveredChord.source && d.target.index === hoveredChord.target) ||
            (d.source.index === hoveredChord.target && d.target.index === hoveredChord.source));
        const isHoveredArc =
          hoveredArc !== null &&
          (d.source.index === hoveredArc || d.target.index === hoveredArc);
        if (isHoveredChord || isHoveredArc) return 0.8;
        if (hoveredArc !== null || hoveredChord !== null) return 0.15;
        return 0.4;
      })
      .on("mouseenter", function (event, d) {
        setHoveredChord({ source: d.source.index, target: d.target.index });
        const regA = displayRegs[d.source.index];
        const regB = displayRegs[d.target.index];
        const key = [regA?.code, regB?.code].sort().join("|");
        const shared = sharedByPair.get(key) ?? d.source.value;
        const rect = containerRef.current?.getBoundingClientRect();
        setTooltip({
          x: rect ? event.clientX - rect.left : event.offsetX,
          y: rect ? event.clientY - rect.top : event.offsetY,
          shared,
          regA: regA?.code ?? "?",
          regB: regB?.code ?? "?"
        });
      })
      .on("mousemove", function (event) {
        const rect = containerRef.current?.getBoundingClientRect();
        setTooltip((t) =>
          t
            ? {
                ...t,
                x: rect ? event.clientX - rect.left : event.offsetX,
                y: rect ? event.clientY - rect.top : event.offsetY
              }
            : null
        );
      })
      .on("mouseleave", function () {
        setHoveredChord(null);
        setTooltip(null);
      });

    // Center text
    const totalShared = Array.from(sharedByPair.values()).reduce((a, b) => a + b, 0) / 2;
    const centerText = g
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("font-size", 14)
      .attr("font-weight", 600)
      .attr("fill", "#374151");
    if (hoveredChord) {
      const regA = displayRegs[hoveredChord.source];
      const regB = displayRegs[hoveredChord.target];
      const key = [regA?.code, regB?.code].sort().join("|");
      centerText.text(`${sharedByPair.get(key) ?? 0} shared`);
    } else {
      centerText.text(`${Math.round(totalShared)} shared controls`);
    }

    return () => {
      svg.selectAll("*").remove();
    };
  }, [displayRegs, hoveredChord, hoveredArc]);

  if (displayRegs.length < 2) return null;

  const jurisdictions = [...new Set(displayRegs.map((r) => r.jurisdiction))];

  return (
    <div className="flex flex-col items-center gap-4">
      <div ref={containerRef} className="relative">
        <svg
          ref={svgRef}
          width="100%"
          height="400"
          viewBox="0 0 400 400"
          preserveAspectRatio="xMidYMid meet"
          className="max-w-[400px]"
        />
        {tooltip && (
          <div
            className="pointer-events-none absolute z-10"
            style={{
              left: tooltip.x + 12,
              top: tooltip.y + 12,
              background: "var(--color-background-primary)",
              border: "0.5px solid var(--color-border-secondary)",
              borderRadius: "var(--border-radius-md)",
              padding: "8px 12px",
              fontSize: 12,
              boxShadow: "none"
            }}
          >
            <span style={{ color: "var(--color-text-secondary)" }}>
              {tooltip.shared} controls shared
            </span>
            <span style={{ color: "var(--color-text-primary)" }}>
              {" "}between {tooltip.regA} and {tooltip.regB}
            </span>
          </div>
        )}
      </div>
      {(moreCount > 0 && showMoreNote) && (
        <p className="text-xs text-slate-500">+ {moreCount} more regulation{moreCount !== 1 ? "s" : ""}</p>
      )}
      <div className="flex flex-wrap justify-center gap-4 text-xs">
        {jurisdictions.map((j) => (
          <span key={j} className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: getJurisdictionColor(j) }}
            />
            {j}
          </span>
        ))}
      </div>
    </div>
  );
}
