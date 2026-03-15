"use client";

import { ForceTopologyGraph, type TopologyNode, type TopologyEdge } from "@/components/topology/ForceTopologyGraph";

type TopologyData = {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
  byLayer: Record<string, number>;
};

export function TopologyClient({ initialData }: { initialData: TopologyData }) {
  const hasData = (initialData?.nodes?.length ?? 0) > 0;

  if (!hasData) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-12"
        style={{ minHeight: "calc(100vh - 200px)" }}
      >
        <p className="text-center text-slate-600">No topology data yet.</p>
        <p className="mt-2 text-center text-sm text-slate-500">
          Add data lineage records and AI assets to see the integration topology.
        </p>
      </div>
    );
  }

  return (
    <div style={{ height: "calc(100vh - 200px)" }}>
      <ForceTopologyGraph nodes={initialData.nodes} edges={initialData.edges} height={600} />
    </div>
  );
}
