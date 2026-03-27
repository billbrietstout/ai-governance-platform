"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { AttestationStatus, CosaiLayer } from "@prisma/client";
import { HelpCircle, ChevronDown, ChevronRight } from "lucide-react";
import type { CascadeNode } from "@/lib/compliance/vertical-cascade";

const COSAI_LAYER_ORDER: CosaiLayer[] = [
  "LAYER_1_BUSINESS",
  "LAYER_2_INFORMATION",
  "LAYER_3_APPLICATION",
  "LAYER_4_PLATFORM",
  "LAYER_5_SUPPLY_CHAIN"
];

const LAYER_COLORS: Record<CosaiLayer, { label: string; text: string; border: string }> = {
  LAYER_1_BUSINESS: { label: "L1 · Business", text: "text-amber-400", border: "border-amber-500/30" },
  LAYER_2_INFORMATION: {
    label: "L2 · Information",
    text: "text-blue-400",
    border: "border-blue-500/30"
  },
  LAYER_3_APPLICATION: {
    label: "L3 · Application",
    text: "text-emerald-400",
    border: "border-emerald-500/30"
  },
  LAYER_4_PLATFORM: { label: "L4 · Platform", text: "text-purple-400", border: "border-purple-500/30" },
  LAYER_5_SUPPLY_CHAIN: {
    label: "L5 · Supply Chain",
    text: "text-rose-400",
    border: "border-rose-500/30"
  }
};

const STATUS_STYLES: Record<AttestationStatus | "NO_DATA", string> = {
  COMPLIANT: "bg-emerald-500/20 text-emerald-300",
  NON_COMPLIANT: "bg-rose-500/20 text-rose-300",
  PENDING: "bg-amber-500/20 text-amber-300",
  NOT_APPLICABLE: "bg-slatePro-700/50 text-slatePro-400",
  NO_DATA: "bg-slatePro-700 text-slatePro-500"
};

function collectByLayer(roots: CascadeNode[]): Map<CosaiLayer, CascadeNode[]> {
  const map = new Map<CosaiLayer, CascadeNode[]>();
  function walk(n: CascadeNode) {
    const list = map.get(n.layer) ?? [];
    list.push(n);
    map.set(n.layer, list);
    n.children.forEach(walk);
  }
  roots.forEach(walk);
  return map;
}

function rollupLayer(nodes: CascadeNode[]): { compliant: number; total: number; hasNonCompliant: boolean } {
  return nodes.reduce<{ compliant: number; total: number; hasNonCompliant: boolean }>(
    (acc, node) => {
      if (node.attestationStatus === "NOT_APPLICABLE") return acc;
      const isCompliant = node.attestationStatus === "COMPLIANT";
      const non = node.attestationStatus === "NON_COMPLIANT";
      return {
        compliant: acc.compliant + (isCompliant ? 1 : 0),
        total: acc.total + 1,
        hasNonCompliant: acc.hasNonCompliant || non
      };
    },
    { compliant: 0, total: 0, hasNonCompliant: false }
  );
}

function connectorClass(status: AttestationStatus | "NO_DATA"): string {
  if (status === "NON_COMPLIANT") return "border-l-rose-500/60";
  if (status === "PENDING" || status === "NO_DATA") return "border-l-amber-500/40";
  if (status === "NOT_APPLICABLE") return "border-l-slate-600";
  return "border-l-slatePro-700";
}

type Props = {
  nodes: CascadeNode[];
  frameworkCode: string;
};

export function RegulationCascadeTree({ nodes, frameworkCode }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const byLayer = useMemo(() => collectByLayer(nodes), [nodes]);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-8">
      {COSAI_LAYER_ORDER.map((layer) => {
        const layerNodes = byLayer.get(layer) ?? [];
        if (layerNodes.length === 0) return null;
        const meta = LAYER_COLORS[layer];
        const roll = rollupLayer(layerNodes);
        const summaryTone =
          roll.total === 0
            ? "text-slate-500"
            : roll.compliant === roll.total
              ? "text-emerald-400"
              : roll.compliant === 0
                ? "text-rose-400"
                : roll.hasNonCompliant
                  ? "text-amber-400"
                  : "text-slate-300";

        return (
          <div key={layer} className="flex gap-4">
            <div
              className={`bg-slatePro-900/50 sticky top-4 flex h-fit w-[120px] shrink-0 flex-col rounded-lg border p-3 ${meta.border}`}
            >
              <span className={`text-xs font-semibold ${meta.text}`}>{meta.label}</span>
              <span className={`mt-2 text-xs tabular-nums ${summaryTone}`}>
                {roll.compliant} / {roll.total} compliant
              </span>
            </div>
            <div className="flex min-w-0 flex-1 flex-wrap gap-3">
              {layerNodes.map((node) => (
                <div
                  key={node.controlId}
                  className={`min-w-[240px] max-w-md flex-1 rounded-lg border border-slatePro-700 bg-slatePro-900/30 pl-3 ${connectorClass(node.attestationStatus)}`}
                >
                  <button
                    type="button"
                    onClick={() => toggle(node.controlId)}
                    className="flex w-full items-start gap-2 p-3 text-left"
                  >
                    {expanded.has(node.controlId) ? (
                      <ChevronDown className="text-slatePro-500 mt-0.5 h-4 w-4 shrink-0" />
                    ) : (
                      <ChevronRight className="text-slatePro-500 mt-0.5 h-4 w-4 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <code className="text-slatePro-400 block font-mono text-xs">{node.controlRef}</code>
                      <span className="text-slatePro-100 mt-1 block text-sm font-medium">{node.label}</span>
                      <span
                        className={`mt-2 inline-block rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[node.attestationStatus]}`}
                      >
                        {node.attestationStatus}
                      </span>
                      {node.layerImpactSummary ? (
                        <p className="text-slatePro-400 mt-2 text-xs">{node.layerImpactSummary}</p>
                      ) : null}
                    </div>
                  </button>
                  {expanded.has(node.controlId) ? (
                    <div className="text-slatePro-500 border-slatePro-800 border-t px-3 pb-3 text-xs">
                      {frameworkCode} · Full control text available in control library.
                    </div>
                  ) : null}
                  {node.vraQuestions && node.vraQuestions.length > 0 ? (
                    <ul className="border-slatePro-800 mt-1 space-y-1 border-t px-3 pb-3">
                      {node.vraQuestions.map((q) => (
                        <li key={q.questionId} className="flex gap-2 text-xs text-slatePro-300">
                          <HelpCircle className="text-slatePro-500 mt-0.5 h-3.5 w-3.5 shrink-0" />
                          <Link
                            href={`/layer5-supply-chain/vendors?riskArea=${encodeURIComponent(q.riskArea)}`}
                            className="text-navy-400 hover:underline"
                          >
                            {q.text}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
