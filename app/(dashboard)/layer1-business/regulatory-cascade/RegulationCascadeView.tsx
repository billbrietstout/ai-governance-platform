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
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-medium text-gray-600">Regulation flow</h2>
        <p className="mt-1 text-gray-900">
          {regulation} requirements cascade from Business (L1) through Supply Chain (L5). Each layer has controls that satisfy the regulation.
        </p>
      </div>

      {steps.map((step) => (
        <div
          key={step.layer}
          className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
        >
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-2">
            <h3 className="font-medium text-gray-900">
              {LAYER_LABELS[step.layer] ?? step.layer}
            </h3>
          </div>
          <div className="p-4">
            {step.controls.length === 0 ? (
              <p className="text-sm text-gray-500">No controls at this layer</p>
            ) : (
              <div className="space-y-2">
                {step.controls.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-start justify-between rounded border border-gray-200 bg-white px-3 py-2"
                  >
                    <div>
                      <span className="font-mono text-sm text-navy-600">{c.controlId}</span>
                      <span className="ml-2 text-gray-900">{c.title}</span>
                    </div>
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
                      Satisfies requirement
                    </span>
                  </div>
                ))}
              </div>
            )}

            {unmetByLayer[step.layer] && unmetByLayer[step.layer].length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-amber-700">Unmet — remediation required</h4>
                <ul className="mt-2 space-y-2">
                  {unmetByLayer[step.layer].map((u, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between rounded border border-amber-200 bg-amber-50 px-3 py-2"
                    >
                      <div>
                        <span className="font-mono text-sm text-amber-800">{u.controlId}</span>
                        <span className="ml-2 text-gray-900">{u.title}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">Owner: {u.owner}</span>
                        <Link
                          href={`/layer3-application/assets/${u.assetId}`}
                          className="text-sm text-navy-600 hover:underline"
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
