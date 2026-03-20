"use client";

import { useActionState } from "react";

type Asset = { id: string; name: string };
type ImportCardAction = (formData: FormData) => Promise<{ error?: string } | never>;

export function CardImportForm({
  assets,
  importCardAction
}: {
  assets: Asset[];
  importCardAction: ImportCardAction;
}) {
  const [state, formAction] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      const result = await importCardAction(formData);
      return result ?? null;
    },
    null as { error?: string } | null
  );

  return (
    <form action={formAction} className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <div className="flex flex-col gap-1">
        <label htmlFor="assetId" className="text-slatePro-400 text-xs">
          Asset
        </label>
        <select
          id="assetId"
          name="assetId"
          required
          className="border-slatePro-600 bg-slatePro-900 text-slatePro-100 rounded border px-3 py-1.5 text-sm"
        >
          <option value="">Select asset</option>
          {assets.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="type" className="text-slatePro-400 text-xs">
          Source type
        </label>
        <select
          id="type"
          name="type"
          required
          className="border-slatePro-600 bg-slatePro-900 text-slatePro-100 rounded border px-3 py-1.5 text-sm"
        >
          <option value="HUGGINGFACE_MODEL">HuggingFace Model</option>
          <option value="HUGGINGFACE_DATASET">HuggingFace Dataset</option>
          <option value="GITHUB">GitHub URL</option>
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="source" className="text-slatePro-400 text-xs">
          Model ID or URL
        </label>
        <input
          id="source"
          name="source"
          type="text"
          required
          placeholder="e.g. meta-llama/Llama-2-7b or https://github.com/..."
          className="border-slatePro-600 bg-slatePro-900 text-slatePro-100 placeholder:text-slatePro-500 w-64 rounded border px-3 py-1.5 text-sm"
        />
      </div>
      <button
        type="submit"
        className="bg-navy-600 hover:bg-navy-500 rounded px-3 py-1.5 text-sm font-medium text-white"
      >
        Import
      </button>
      {state?.error && <p className="text-sm text-red-400 sm:self-center">{state.error}</p>}
    </form>
  );
}
