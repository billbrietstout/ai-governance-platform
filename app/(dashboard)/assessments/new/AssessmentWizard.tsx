"use client";

import { useState } from "react";
import { useActionState } from "react";

const LAYERS = [
  "LAYER_1_BUSINESS",
  "LAYER_2_INFORMATION",
  "LAYER_3_APPLICATION",
  "LAYER_4_PLATFORM",
  "LAYER_5_SUPPLY_CHAIN"
];

type Asset = { id: string; name: string };
type Framework = { id: string; name: string; code: string };

type Props = {
  assets: Asset[];
  frameworks: Framework[];
  preselectedAssetId?: string;
  createAction: (formData: FormData) => Promise<{ error?: string } | never>;
};

export function AssessmentWizard({ assets, frameworks, preselectedAssetId, createAction }: Props) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [assetId, setAssetId] = useState(preselectedAssetId ?? "");
  const [frameworkIds, setFrameworkIds] = useState<string[]>([]);
  const [layersInScope, setLayersInScope] = useState<string[]>([]);

  const [state, formAction] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      formData.set("assetId", assetId);
      formData.set("frameworkIds", JSON.stringify(frameworkIds));
      formData.set("layersInScope", JSON.stringify(layersInScope));
      const result = await createAction(formData);
      return result ?? null;
    },
    null as { error?: string } | null
  );

  function toggleFramework(id: string) {
    setFrameworkIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleLayer(l: string) {
    setLayersInScope((prev) => (prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l]));
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStep(s)}
            className={`rounded px-3 py-1 text-sm ${
              step === s ? "bg-navy-600 text-white" : "bg-slatePro-800 text-slatePro-400"
            }`}
          >
            Step {s}
          </button>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slatePro-300">Select asset</label>
          <select
            value={assetId}
            onChange={(e) => setAssetId(e.target.value)}
            className="w-full rounded border border-slatePro-600 bg-slatePro-900 px-3 py-2 text-slatePro-100"
          >
            <option value="">—</option>
            {assets.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setStep(2)}
            disabled={!assetId}
            className="rounded bg-navy-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slatePro-300">Select frameworks (vertical-applicable first)</label>
          <div className="space-y-1">
            {frameworks.map((f) => (
              <label key={f.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={frameworkIds.includes(f.id)}
                  onChange={() => toggleFramework(f.id)}
                  className="rounded"
                />
                <span className="text-slatePro-200">{f.name} ({f.code})</span>
              </label>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setStep(3)}
            disabled={frameworkIds.length === 0}
            className="rounded bg-navy-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slatePro-300">Select CoSAI layers in scope</label>
          <div className="space-y-1">
            {LAYERS.map((l) => (
              <label key={l} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={layersInScope.includes(l)}
                  onChange={() => toggleLayer(l)}
                  className="rounded"
                />
                <span className="text-slatePro-200">{l.replace("LAYER_", "L").replace(/_/g, " ")}</span>
              </label>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setStep(4)}
            disabled={layersInScope.length === 0}
            className="rounded bg-navy-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {step === 4 && (
        <form action={formAction} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slatePro-300">Assessment name</label>
            <input
              id="name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Q1 2025 EU AI Act Assessment"
              className="mt-1 w-full rounded border border-slatePro-600 bg-slatePro-900 px-3 py-2 text-slatePro-100"
            />
          </div>
          <p className="text-xs text-slatePro-500">Reviewers can be assigned per layer in the assessment workflow.</p>
          {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
          <button
            type="submit"
            className="rounded bg-navy-600 px-4 py-2 text-sm font-medium text-white hover:bg-navy-500"
          >
            Create Assessment
          </button>
        </form>
      )}
    </div>
  );
}
