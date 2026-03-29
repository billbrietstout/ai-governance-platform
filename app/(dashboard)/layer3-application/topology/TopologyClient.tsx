"use client";

import {
  ForceTopologyGraph,
  type TopologyNode,
  type TopologyEdge
} from "@/components/topology/ForceTopologyGraph";

type TopologyData = {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
  byLayer: Record<string, number>;
};

export function TopologyClient({ initialData }: { initialData: TopologyData }) {
  const nodeCount = initialData?.nodes?.length ?? 0;
  const hasEnoughData = nodeCount >= 3;

  if (!hasEnoughData) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-12"
        style={{ minHeight: 400 }}
      >
        <p className="text-center text-slate-600">Not enough topology data yet.</p>
        <p className="mt-2 text-center text-sm text-slate-500">
          Add at least 3 entities (organization, data entities, AI assets, or vendors) to see the
          integration topology.
        </p>
      </div>
    );
  }

  return <ForceTopologyGraph nodes={initialData.nodes} edges={initialData.edges} height={600} />;
}
