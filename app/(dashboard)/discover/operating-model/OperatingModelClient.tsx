"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { OPERATING_MODELS, type OperatingModelKey } from "@/lib/operating-models/matrix";
import { setOperatingModel } from "./actions";

type Props = { currentModel: string | null };

export function OperatingModelClient({ currentModel }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<OperatingModelKey | null>(
    currentModel && ["IAAS", "PAAS", "AGENT_PAAS", "SAAS"].includes(currentModel)
      ? (currentModel as OperatingModelKey)
      : null
  );
  const [compareMode, setCompareMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSetModel = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await setOperatingModel(selected);
      setSaved(true);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const model = selected ? OPERATING_MODELS.find((m) => m.key === selected) : null;

  return (
    <div className="space-y-6">
      {/* Model cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {OPERATING_MODELS.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setSelected(m.key as OperatingModelKey)}
            className={`rounded-lg border p-5 text-left shadow-sm transition ${
              selected === m.key
                ? "border-navy-500 bg-navy-50 ring-2 ring-navy-500"
                : "border-slate-200 bg-white hover:border-slate-300 hover:shadow"
            }`}
          >
            <h3 className="font-semibold text-slate-900">{m.name}</h3>
            <p className="mt-1 text-sm text-slate-600">{m.description}</p>
            <div className="mt-3">
              <p className="text-xs font-medium text-slate-500">Examples</p>
              <ul className="mt-1 space-y-0.5 text-xs text-slate-600">
                {m.examples.slice(0, 2).map((ex) => (
                  <li key={ex}>• {ex}</li>
                ))}
              </ul>
            </div>
            <div className="mt-2">
              <p className="text-xs font-medium text-slate-500">Best for</p>
              <p className="mt-0.5 text-xs text-slate-600">{m.bestFor.slice(0, 2).join(", ")}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Compare toggle */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setCompareMode(!compareMode)}
          className={`rounded px-3 py-1.5 text-sm font-medium ${
            compareMode ? "bg-navy-100 text-navy-700" : "bg-slate-100 text-slate-600"
          }`}
        >
          Compare models
        </button>
      </div>

      {/* Matrix: single or compare */}
      {compareMode ? (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Layer</th>
                {OPERATING_MODELS.map((m) => (
                  <th key={m.key} colSpan={3} className="px-4 py-3 text-center text-xs font-medium text-slate-600">
                    {m.name}
                  </th>
                ))}
              </tr>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-2 text-left text-xs text-slate-500" />
                {OPERATING_MODELS.map((m) => (
                  <React.Fragment key={m.key}>
                    <th className="px-2 py-2 text-center text-[10px] font-medium text-blue-600">Customer</th>
                    <th className="px-2 py-2 text-center text-[10px] font-medium text-amber-600">Shared</th>
                    <th className="px-2 py-2 text-center text-[10px] font-medium text-slate-500">Provider</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {["L1", "L2", "L3", "L4", "L5"].map((layerId) => (
                <tr key={layerId} className="border-b border-slate-100">
                  <td className="px-4 py-2 text-sm font-medium text-slate-700">
                    {OPERATING_MODELS[0]?.matrix.find((r) => r.layer === layerId)?.label ?? layerId}
                  </td>
                  {OPERATING_MODELS.map((m) => {
                    const row = m.matrix.find((r) => r.layer === layerId);
                    if (!row) return null;
                    return (
                      <React.Fragment key={m.key}>
                        <td className="px-2 py-2 text-center">
                          {row.customer ? (
                            <span className="inline-block h-4 w-4 rounded bg-blue-200" title="Customer" />
                          ) : (
                            <span className="inline-block h-4 w-4 rounded bg-slate-100" />
                          )}
                        </td>
                        <td className="px-2 py-2 text-center">
                          {row.shared ? (
                            <span className="inline-block h-4 w-4 rounded bg-amber-200" title="Shared" />
                          ) : (
                            <span className="inline-block h-4 w-4 rounded bg-slate-100" />
                          )}
                        </td>
                        <td className="px-2 py-2 text-center">
                          {row.provider ? (
                            <span className="inline-block h-4 w-4 rounded bg-slate-300" title="Provider" />
                          ) : (
                            <span className="inline-block h-4 w-4 rounded bg-slate-100" />
                          )}
                        </td>
                      </React.Fragment>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        model && (
          <>
            {/* Single model matrix */}
            <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
              <h3 className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                CoSAI 5-Layer Responsibility Matrix — {model.name}
              </h3>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">Layer</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-blue-600">Customer</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-amber-600">Shared</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-slate-600">Provider</th>
                  </tr>
                </thead>
                <tbody>
                  {model.matrix.map((row) => (
                    <tr key={row.layer} className="border-b border-slate-100">
                      <td className="px-4 py-2 text-sm font-medium text-slate-700">{row.label}</td>
                      <td className="px-4 py-2 text-center">
                        {row.customer ? (
                          <span className="inline-block rounded bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                            Customer
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {row.shared ? (
                          <span className="inline-block rounded bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
                            Shared
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {row.provider ? (
                          <span className="inline-block rounded bg-slate-200 px-3 py-1 text-xs font-medium text-slate-700">
                            Provider
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* What this means for you */}
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <h3 className="mb-3 text-sm font-medium text-slate-700">What this means for you</h3>
              <ul className="space-y-2">
                {model.customerResponsibilities.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-navy-500" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>

            {/* Set as my operating model */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleSetModel}
                disabled={saving || selected === currentModel}
                className="rounded bg-navy-600 px-4 py-2 text-sm font-medium text-white hover:bg-navy-500 disabled:opacity-50"
              >
                {saving ? "Saving…" : saved ? "Saved" : "Set as my operating model"}
              </button>
              {currentModel && (
                <span className="text-sm text-slate-500">
                  Current: {OPERATING_MODELS.find((m) => m.key === currentModel)?.name ?? currentModel}
                </span>
              )}
            </div>
          </>
        )
      )}
    </div>
  );
}
