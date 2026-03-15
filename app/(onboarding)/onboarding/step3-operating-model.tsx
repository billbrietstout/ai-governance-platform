"use client";

import { useState } from "react";
import { OPERATING_MODELS } from "@/lib/onboarding/steps";
import {
  COSAI_LAYERS,
  COSAI_RESPONSIBILITY_MATRIX,
  type Responsibility
} from "@/lib/onboarding/cosai-matrix";
import { saveStep3 } from "./actions";

type Props = {
  completedData: { operatingModel: string | null };
  onNext: () => void;
  isPending: boolean;
};

function ResponsibilityBadge({ r }: { r: Responsibility }) {
  const styles = {
    Customer: "bg-blue-100 text-blue-800",
    Provider: "bg-amber-100 text-amber-800",
    Shared: "bg-slate-100 text-slate-700"
  };
  return (
    <span
      className={`rounded px-2 py-0.5 text-xs font-medium ${styles[r]}`}
    >
      {r}
    </span>
  );
}

export function Step3OperatingModel({
  completedData,
  onNext,
  isPending
}: Props) {
  const [selected, setSelected] = useState<string | null>(
    completedData.operatingModel
  );

  const matrix = selected ? COSAI_RESPONSIBILITY_MATRIX[selected] : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    await saveStep3({
      operatingModel: selected as "IAAS" | "PAAS" | "AGENT_PAAS" | "SAAS" | "MIXED"
    });
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {OPERATING_MODELS.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => setSelected(m.value)}
            className={`flex flex-col rounded-lg border p-4 text-left transition ${
              selected === m.value
                ? "border-navy-500 bg-navy-50 ring-1 ring-navy-500"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <span className="text-sm font-semibold text-slate-900">
              {m.label}
            </span>
            <span className="mt-1 text-xs text-slate-600">{m.description}</span>
          </button>
        ))}
      </div>

      {matrix && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-medium text-slate-700">
            CoSAI shared responsibility matrix
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Who owns what at each layer for your selected model
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-3 py-2 text-left font-medium text-slate-700">
                    Layer
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-slate-700">
                    Responsibility
                  </th>
                </tr>
              </thead>
              <tbody>
                {COSAI_LAYERS.map((layer) => (
                  <tr
                    key={layer.id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-3 py-2">
                      <span className="font-medium text-slate-900">
                        {layer.label}
                      </span>
                      <span className="ml-1 text-slate-500">
                        — {layer.desc}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <ResponsibilityBadge
                        r={matrix[layer.id] ?? "Shared"}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!selected || isPending}
          className="rounded bg-navy-600 px-4 py-2 text-sm font-medium text-white hover:bg-navy-500 disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Next"}
        </button>
      </div>
    </form>
  );
}
