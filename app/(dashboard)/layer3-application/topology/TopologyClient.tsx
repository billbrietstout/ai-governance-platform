"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { RotateCcw, X } from "lucide-react";

type Node = { id: string; label: string; layer: string; role: string; link?: string };
type Edge = { from: string; to: string };
type ByLayer = Record<string, number>;

type Props = {
  initialData: { nodes: Node[]; edges: Edge[]; byLayer: ByLayer };
};

const LAYER_ORDER = ["L1", "L2", "L3", "L4", "L5"];
const LAYER_LABELS: Record<string, string> = {
  L1: "Business",
  L2: "Information",
  L3: "Application",
  L4: "Platform",
  L5: "Supply Chain"
};
const LAYER_COLORS: Record<string, string> = {
  L1: "#1e3a5f",
  L2: "#3b82f6",
  L3: "#8b5cf6",
  L4: "#f97316",
  L5: "#ef4444"
};

const NODE_WIDTH = 120;
const NODE_HEIGHT = 36;
const LANE_HEIGHT = 120;
const MARGIN = 40;

export function TopologyClient({ initialData }: Props) {
  const [nodes, setNodes] = useState(initialData.nodes);
  const [edges] = useState(initialData.edges);
  const [byLayer, setByLayer] = useState(initialData.byLayer);
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [selected, setSelected] = useState<Node | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  const layoutNodes = useCallback(() => {
    const pos: Record<string, { x: number; y: number }> = {};
    const byL: Record<string, Node[]> = {};
    for (const l of LAYER_ORDER) byL[l] = [];
    for (const n of nodes) {
      if (byL[n.layer]) byL[n.layer].push(n);
    }
    for (let li = 0; li < LAYER_ORDER.length; li++) {
      const layer = LAYER_ORDER[li];
      const layerNodes = byL[layer] ?? [];
      const y = MARGIN + li * LANE_HEIGHT + LANE_HEIGHT / 2 - NODE_HEIGHT / 2;
      layerNodes.forEach((n, i) => {
        pos[n.id] = {
          x: MARGIN + (i % 6) * (NODE_WIDTH + 24),
          y
        };
      });
    }
    setPositions(pos);
  }, [nodes]);

  useEffect(() => {
    layoutNodes();
  }, [layoutNodes]);

  const handleMouseDown = (e: React.MouseEvent, node: Node) => {
    e.stopPropagation();
    setDragging(node.id);
    const rect = svgRef.current?.getBoundingClientRect();
    if (rect) {
      const pos = positions[node.id] ?? { x: 0, y: 0 };
      setDragOffset({
        x: e.clientX - rect.left - pos.x,
        y: e.clientY - rect.top - pos.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    setPositions((prev) => ({
      ...prev,
      [dragging]: {
        x: Math.max(0, e.clientX - rect.left - dragOffset.x),
        y: Math.max(0, e.clientY - rect.top - dragOffset.y)
      }
    }));
  };

  const handleMouseUp = () => setDragging(null);

  const inbound = selected ? edges.filter((e) => e.to === selected.id) : [];
  const outbound = selected ? edges.filter((e) => e.from === selected.id) : [];

  const width = 900;
  const height = LAYER_ORDER.length * LANE_HEIGHT + MARGIN * 2;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex gap-4">
          {LAYER_ORDER.map((l) => (
            <span key={l} className="text-sm">
              <span className="font-medium" style={{ color: LAYER_COLORS[l] }}>
                {l}
              </span>
              : {byLayer[l] ?? 0}
            </span>
          ))}
        </div>
        <button
          type="button"
          onClick={layoutNodes}
          className="flex items-center gap-2 rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
        >
          <RotateCcw className="h-4 w-4" />
          Reset layout
        </button>
      </div>

      <div className="relative overflow-auto rounded-lg border border-slate-200 bg-white">
        <svg
          ref={svgRef}
          width={width}
          height={height}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="cursor-default"
        >
          {LAYER_ORDER.map((l, i) => (
            <rect
              key={l}
              x={0}
              y={i * LANE_HEIGHT}
              width={width}
              height={LANE_HEIGHT}
              fill={i % 2 === 0 ? "#f8fafc" : "#f1f5f9"}
              stroke="#e2e8f0"
            />
          ))}
          {LAYER_ORDER.map((l, i) => (
            <text
              key={`label-${l}`}
              x={12}
              y={i * LANE_HEIGHT + 24}
              className="text-xs font-medium"
              fill="#64748b"
            >
              {l} {LAYER_LABELS[l]}
            </text>
          ))}
          {edges.map((e, i) => {
            const fromPos = positions[e.from] ?? { x: 0, y: 0 };
            const toPos = positions[e.to] ?? { x: 0, y: 0 };
            const midX = (fromPos.x + toPos.x) / 2;
            return (
              <line
                key={`${e.from}-${e.to}-${i}`}
                x1={fromPos.x + NODE_WIDTH / 2}
                y1={fromPos.y + NODE_HEIGHT / 2}
                x2={toPos.x + NODE_WIDTH / 2}
                y2={toPos.y + NODE_HEIGHT / 2}
                stroke="#94a3b8"
                strokeWidth={1}
                strokeDasharray="4 2"
              />
            );
          })}
          {nodes.map((n) => {
            const pos = positions[n.id] ?? { x: 0, y: 0 };
            const color = LAYER_COLORS[n.layer] ?? "#64748b";
            const isSelected = selected?.id === n.id;
            return (
              <g
                key={n.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                onMouseDown={(e) => handleMouseDown(e, n)}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected(n);
                }}
                style={{ cursor: "move" }}
              >
                <rect
                  width={NODE_WIDTH}
                  height={NODE_HEIGHT}
                  rx={6}
                  fill="white"
                  stroke={isSelected ? color : "#cbd5e1"}
                  strokeWidth={isSelected ? 3 : 1}
                  filter="drop-shadow(0 1px 2px rgba(0,0,0,0.1))"
                />
                <text
                  x={NODE_WIDTH / 2}
                  y={NODE_HEIGHT / 2 + 4}
                  textAnchor="middle"
                  className="text-xs font-medium"
                  fill="#1e293b"
                >
                  {n.label.length > 14 ? n.label.slice(0, 12) + "…" : n.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {selected && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-medium text-slate-900">{selected.label}</h3>
              <p className="text-sm text-slate-600">
                {selected.layer} • {selected.role}
              </p>
              <div className="mt-2 flex gap-4 text-sm">
                <span>Inbound: {inbound.length}</span>
                <span>Outbound: {outbound.length}</span>
              </div>
              {selected.link && (
                <Link
                  href={selected.link}
                  className="mt-2 inline-block text-sm text-navy-600 hover:underline"
                >
                  View detail →
                </Link>
              )}
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="text-slate-500 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      <p className="text-xs text-slate-500">
        Click a node to select. Drag to reposition. Edges from DataLineageRecord (L2→L3).
      </p>
    </div>
  );
}
