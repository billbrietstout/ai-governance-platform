"use client";

import Link from "next/link";
import { Lock, Unlock, RotateCcw } from "lucide-react";
import { RegulationChordDiagram } from "@/components/discovery/RegulationChordDiagram";
import type { RegulationDiscoveryResult } from "@/lib/discovery/engine";

const LAYER_LABELS: Record<string, string> = {
  LAYER_1_BUSINESS: "Layer 1: Business",
  LAYER_2_INFORMATION: "Layer 2: Information",
  LAYER_3_APPLICATION: "Layer 3: Application",
  LAYER_4_PLATFORM: "Layer 4: Platform",
  LAYER_5_SUPPLY_CHAIN: "Layer 5: Supply Chain"
};

type Props = {
  results: RegulationDiscoveryResult;
  onStartOver: () => void;
};

export function GuestResultsView({ results, onStartOver }: Props) {
  const mandatory = results.mandatory ?? [];
  const likelyApplicable = results.likelyApplicable ?? [];
  const recommended = results.recommended ?? [];
  const requiredControls = results.requiredControls ?? [];
  const top3Controls = requiredControls.slice(0, 3);

  const applicableRegulations = [...mandatory, ...likelyApplicable].map((r) => ({
    code: r.code,
    name: r.name,
    jurisdiction: r.jurisdiction,
    applicability: r.applicability,
    mandatory: r.applicability === "MANDATORY"
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-medium text-slate-900">Your Discovery Results</h2>
        <button
          type="button"
          onClick={onStartOver}
          className="inline-flex items-center gap-2 rounded border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <RotateCcw className="h-4 w-4" />
          Start over
        </button>
      </div>

      {/* Risk score & maturity */}
      <div className="flex gap-4">
        {results.riskScore != null && (
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
            <span className="text-sm text-slate-600">Risk score</span>
            <p className="text-xl font-bold text-slate-900">{results.riskScore}/100</p>
          </div>
        )}
        {results.estimatedMaturityRequired != null && (
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
            <span className="text-sm text-slate-600">Estimated maturity required</span>
            <p className="text-xl font-bold text-slate-900">M{results.estimatedMaturityRequired}</p>
          </div>
        )}
      </div>

      {/* Applicable regulations */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Applicable Regulations</h3>
        <ul className="mt-3 space-y-2">
          {mandatory.map((r) => (
            <li key={r.code} className="flex items-center gap-2">
              <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                MANDATORY
              </span>
              <span className="font-medium text-slate-900">{r.name}</span>
              <span className="text-xs text-slate-500">({r.jurisdiction})</span>
            </li>
          ))}
          {likelyApplicable.map((r) => (
            <li key={r.code} className="flex items-center gap-2">
              <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                LIKELY
              </span>
              <span className="font-medium text-slate-900">{r.name}</span>
              <span className="text-xs text-slate-500">({r.jurisdiction})</span>
            </li>
          ))}
          {mandatory.length === 0 && likelyApplicable.length === 0 && recommended.length > 0 && (
            <li className="text-sm text-slate-600">
              No mandatory or likely regulations identified. Consider these frameworks:
            </li>
          )}
          {recommended.map((r) => (
            <li key={r.code} className="flex items-center gap-2">
              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                RECOMMENDED
              </span>
              <span className="font-medium text-slate-900">{r.name}</span>
              <span className="text-xs text-slate-500">({r.jurisdiction})</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Chord diagram */}
      {applicableRegulations.length >= 2 && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Regulatory Overlap</h3>
          <div className="mt-3">
            <RegulationChordDiagram regulations={applicableRegulations} />
          </div>
        </div>
      )}

      {/* Top 3 controls */}
      {top3Controls.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Top 3 Required Controls</h3>
          <ul className="mt-3 space-y-2">
            {top3Controls.map((c) => (
              <li
                key={c.controlId}
                className="flex items-center justify-between rounded border border-slate-200 px-3 py-2"
              >
                <span className="font-medium text-slate-900">{c.title}</span>
                <span className="text-xs text-slate-500">
                  {LAYER_LABELS[c.cosaiLayer] ?? c.cosaiLayer}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Blurred/locked section */}
      <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <Lock className="h-12 w-12 text-white/80" />
          <p className="mt-2 text-sm font-medium text-white">
            Full control list, evidence requirements, and implementation roadmap
          </p>
          <p className="mt-1 text-xs text-white/70">Create a free account to unlock</p>
          <Link
            href="/login?callbackUrl=/discover/wizard"
            className="relative z-20 mt-4 inline-flex items-center gap-2 rounded-lg bg-navy-600 px-4 py-2 text-sm font-medium text-white hover:bg-navy-500"
          >
            <Unlock className="h-4 w-4" />
            Unlock full results — free forever for up to 10 assets
          </Link>
        </div>
        <div className="p-6 opacity-30">
          <h3 className="font-medium text-slate-700">Full Control List (locked)</h3>
          <ul className="mt-2 space-y-1 text-sm text-slate-600">
            {requiredControls.slice(0, 5).map((c) => (
              <li key={c.controlId}>{c.title}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
