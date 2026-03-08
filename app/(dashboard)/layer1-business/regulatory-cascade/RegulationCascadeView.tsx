"use client";

import Link from "next/link";

const LAYER_LABELS: Record<string, string> = {
  LAYER_1_BUSINESS: "Layer 1: Business",
  LAYER_2_INFORMATION: "Layer 2: Information",
  LAYER_3_APPLICATION: "Layer 3: Application",
  LAYER_4_PLATFORM: "Layer 4: Platform",
  LAYER_5_SUPPLY_CHAIN: "Layer 5: Supply Chain"
};

type Step = {
  layer: string;
  controls: { id: string; controlId: string; title: string; frameworkCode: string }[];
};

type Unmet = { controlId: string; title: string; owner: string; assetId: string; assetName: string };

type Props = {
  regulation: string;
  steps: Step[];
  unmetByLayer: Record<string, Unmet[]>;
};

export function RegulationCascadeView({ regulation, steps, unmetByLayer }: Props) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slatePro-700 bg-slatePro-900/30 p-4">
        <h2 className="text-sm font-medium text-slatePro-400">Regulation flow</h2>
        <p className="mt-1 text-slatePro-200">
          {regulation} requirements cascade from Business (L1) through Supply Chain (L5). Each layer has controls that satisfy the regulation.
        </p>
      </div>

      {steps.map((step) => (
        <div
          key={step.layer}
          className="rounded-lg border border-slatePro-700 bg-slatePro-900/30 overflow-hidden"
        >
          <div className="border-b border-slatePro-700 bg-slatePro-900/50 px-4 py-2">
            <h3 className="font-medium text-slatePro-200">
              {LAYER_LABELS[step.layer] ?? step.layer}
            </h3>
          </div>
          <div className="p-4">
            {step.controls.length === 0 ? (
              <p className="text-sm text-slatePro-500">No controls at this layer</p>
            ) : (
              <div className="space-y-2">
                {step.controls.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-start justify-between rounded border border-slatePro-700 bg-slatePro-900/50 px-3 py-2"
                  >
                    <div>
                      <span className="font-mono text-sm text-navy-300">{c.controlId}</span>
                      <span className="ml-2 text-slatePro-200">{c.title}</span>
                    </div>
                    <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">
                      Satisfies requirement
                    </span>
                  </div>
                ))}
              </div>
            )}

            {unmetByLayer[step.layer] && unmetByLayer[step.layer].length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-amber-400">Unmet — remediation required</h4>
                <ul className="mt-2 space-y-2">
                  {unmetByLayer[step.layer].map((u, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between rounded border border-amber-500/30 bg-amber-500/10 px-3 py-2"
                    >
                      <div>
                        <span className="font-mono text-sm text-amber-300">{u.controlId}</span>
                        <span className="ml-2 text-slatePro-200">{u.title}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-slatePro-400">Owner: {u.owner}</span>
                        <Link
                          href={`/layer3-application/assets/${u.assetId}`}
                          className="text-sm text-navy-400 hover:underline"
                        >
                          {u.assetName} →
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
