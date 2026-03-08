"use client";

import { useActionState } from "react";
import { createAsset } from "./actions";

type Props = {
  euRequiredArticles: string[];
  users: { id: string; email: string }[];
};

export function CreateAssetForm({ euRequiredArticles, users }: Props) {
  const [state, formAction] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      const result = await createAsset(formData);
      return result ?? null;
    },
    null as { error?: string } | null
  );

  return (
    <form action={formAction} className="space-y-6 rounded-lg border border-slatePro-700 bg-slatePro-900/30 p-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slatePro-300">Name</label>
        <input
          id="name"
          name="name"
          required
          className="mt-1 w-full rounded border border-slatePro-600 bg-slatePro-900 px-3 py-2 text-slatePro-100"
        />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-slatePro-300">Description</label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className="mt-1 w-full rounded border border-slatePro-600 bg-slatePro-900 px-3 py-2 text-slatePro-100"
        />
      </div>
      <div>
        <label htmlFor="assetType" className="block text-sm font-medium text-slatePro-300">Asset Type</label>
        <select
          id="assetType"
          name="assetType"
          required
          className="mt-1 w-full rounded border border-slatePro-600 bg-slatePro-900 px-3 py-2 text-slatePro-100"
        >
          <option value="MODEL">Model</option>
          <option value="PROMPT">Prompt</option>
          <option value="AGENT">Agent</option>
          <option value="DATASET">Dataset</option>
          <option value="APPLICATION">Application</option>
          <option value="TOOL">Tool</option>
          <option value="PIPELINE">Pipeline</option>
        </select>
      </div>
      <div>
        <label htmlFor="euRiskLevel" className="block text-sm font-medium text-slatePro-300">EU Risk Level</label>
        <select
          id="euRiskLevel"
          name="euRiskLevel"
          className="mt-1 w-full rounded border border-slatePro-600 bg-slatePro-900 px-3 py-2 text-slatePro-100"
        >
          <option value="">—</option>
          <option value="MINIMAL">Minimal</option>
          <option value="LIMITED">Limited</option>
          <option value="HIGH">High</option>
          <option value="UNACCEPTABLE">Unacceptable</option>
        </select>
        {euRequiredArticles.length > 0 && (
          <p className="mt-1 text-xs text-amber-400">Required: {euRequiredArticles.join(", ")}</p>
        )}
      </div>
      <div>
        <label htmlFor="operatingModel" className="block text-sm font-medium text-slatePro-300">Operating Model</label>
        <select
          id="operatingModel"
          name="operatingModel"
          className="mt-1 w-full rounded border border-slatePro-600 bg-slatePro-900 px-3 py-2 text-slatePro-100"
        >
          <option value="">—</option>
          <option value="IN_HOUSE">In House</option>
          <option value="VENDOR">Vendor</option>
          <option value="HYBRID">Hybrid</option>
        </select>
      </div>
      <div>
        <label htmlFor="cosaiLayer" className="block text-sm font-medium text-slatePro-300">CoSAI Layer</label>
        <select
          id="cosaiLayer"
          name="cosaiLayer"
          className="mt-1 w-full rounded border border-slatePro-600 bg-slatePro-900 px-3 py-2 text-slatePro-100"
        >
          <option value="">—</option>
          <option value="LAYER_1_BUSINESS">Layer 1: Business</option>
          <option value="LAYER_2_INFORMATION">Layer 2: Information</option>
          <option value="LAYER_3_APPLICATION">Layer 3: Application</option>
          <option value="LAYER_4_PLATFORM">Layer 4: Platform</option>
          <option value="LAYER_5_SUPPLY_CHAIN">Layer 5: Supply Chain</option>
        </select>
      </div>
      <div>
        <label htmlFor="autonomyLevel" className="block text-sm font-medium text-slatePro-300">Autonomy Level</label>
        <select
          id="autonomyLevel"
          name="autonomyLevel"
          className="mt-1 w-full rounded border border-slatePro-600 bg-slatePro-900 px-3 py-2 text-slatePro-100"
        >
          <option value="">—</option>
          <option value="HUMAN_ONLY">Human Only</option>
          <option value="ASSISTED">Assisted</option>
          <option value="SEMI_AUTONOMOUS">Semi-Autonomous</option>
          <option value="AUTONOMOUS">Autonomous</option>
        </select>
      </div>
      <div>
        <label htmlFor="verticalMarket" className="block text-sm font-medium text-slatePro-300">Vertical Market</label>
        <select
          id="verticalMarket"
          name="verticalMarket"
          className="mt-1 w-full rounded border border-slatePro-600 bg-slatePro-900 px-3 py-2 text-slatePro-100"
        >
          <option value="">—</option>
          <option value="GENERAL">General</option>
          <option value="HEALTHCARE">Healthcare</option>
          <option value="FINANCIAL">Financial</option>
          <option value="AUTOMOTIVE">Automotive</option>
          <option value="RETAIL">Retail</option>
          <option value="MANUFACTURING">Manufacturing</option>
          <option value="PUBLIC_SECTOR">Public Sector</option>
        </select>
      </div>
      <div>
        <label htmlFor="ownerId" className="block text-sm font-medium text-slatePro-300">Owner</label>
        <select
          id="ownerId"
          name="ownerId"
          className="mt-1 w-full rounded border border-slatePro-600 bg-slatePro-900 px-3 py-2 text-slatePro-100"
        >
          <option value="">—</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.email}</option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <input
          id="createAccountability"
          name="createAccountability"
          type="checkbox"
          value="on"
          className="rounded border-slatePro-600"
        />
        <label htmlFor="createAccountability" className="text-sm text-slatePro-300">
          Auto-create AccountabilityAssignment on save
        </label>
      </div>
      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      <button
        type="submit"
        className="rounded bg-navy-600 px-4 py-2 text-sm font-medium text-white hover:bg-navy-500"
      >
        Create Asset
      </button>
    </form>
  );
}
