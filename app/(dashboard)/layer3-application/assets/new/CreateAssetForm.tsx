"use client";

import { useActionState } from "react";
import { createAsset } from "./actions";
import { DataSourcesSection } from "./DataSourcesSection";

type MasterDataEntity = { id: string; name: string; classification: string };

type Defaults = {
  name?: string;
  description?: string;
  assetType?: string;
  euRiskLevel?: string;
  verticalMarket?: string;
  autonomyLevel?: string;
};

type Props = {
  euRequiredArticles: string[];
  users: { id: string; email: string }[];
  masterDataEntities?: MasterDataEntity[];
  defaults?: Defaults;
};

export function CreateAssetForm({
  euRequiredArticles,
  users,
  masterDataEntities = [],
  defaults
}: Props) {
  const [state, formAction] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      const result = await createAsset(formData);
      return result ?? null;
    },
    null as { error?: string } | null
  );

  return (
    <form
      action={formAction}
      className="space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
    >
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={defaults?.name}
          className="mt-1 w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900"
        />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={defaults?.description}
          className="mt-1 w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900"
        />
      </div>
      <div>
        <label htmlFor="assetType" className="block text-sm font-medium text-gray-700">
          Asset Type
        </label>
        <select
          id="assetType"
          name="assetType"
          required
          defaultValue={defaults?.assetType}
          className="mt-1 w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900"
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
        <label htmlFor="euEntityType" className="block text-sm font-medium text-gray-700">
          EU AI Act Entity Type
        </label>
        <select
          id="euEntityType"
          name="euEntityType"
          className="mt-1 w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900"
        >
          <option value="">—</option>
          <option value="PROVIDER">Provider</option>
          <option value="DEPLOYER">Deployer</option>
          <option value="DISTRIBUTOR">Distributor</option>
          <option value="IMPORTER">Importer</option>
          <option value="PRODUCT_MANUFACTURER">Product Manufacturer</option>
          <option value="AUTHORISED_REPRESENTATIVE">Authorised Representative</option>
        </select>
      </div>
      <div>
        <label htmlFor="euRiskLevel" className="block text-sm font-medium text-gray-700">
          EU Risk Level
        </label>
        <select
          id="euRiskLevel"
          name="euRiskLevel"
          defaultValue={defaults?.euRiskLevel}
          className="mt-1 w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900"
        >
          <option value="">—</option>
          <option value="MINIMAL">Minimal</option>
          <option value="LIMITED">Limited</option>
          <option value="HIGH">High</option>
          <option value="UNACCEPTABLE">Unacceptable</option>
        </select>
        {euRequiredArticles.length > 0 && (
          <p className="mt-1 text-xs text-amber-700">Required: {euRequiredArticles.join(", ")}</p>
        )}
      </div>
      <div>
        <label htmlFor="operatingModel" className="block text-sm font-medium text-gray-700">
          Operating Model
        </label>
        <select
          id="operatingModel"
          name="operatingModel"
          className="mt-1 w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900"
        >
          <option value="">—</option>
          <option value="IN_HOUSE">In House</option>
          <option value="VENDOR">Vendor</option>
          <option value="HYBRID">Hybrid</option>
        </select>
      </div>
      <div>
        <label htmlFor="cosaiLayer" className="block text-sm font-medium text-gray-700">
          CoSAI Layer
        </label>
        <select
          id="cosaiLayer"
          name="cosaiLayer"
          className="mt-1 w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900"
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
        <label htmlFor="autonomyLevel" className="block text-sm font-medium text-gray-700">
          Autonomy Level
        </label>
        <select
          id="autonomyLevel"
          name="autonomyLevel"
          defaultValue={defaults?.autonomyLevel}
          className="mt-1 w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900"
        >
          <option value="">—</option>
          <option value="HUMAN_ONLY">Human Only</option>
          <option value="ASSISTED">Assisted</option>
          <option value="SEMI_AUTONOMOUS">Semi-Autonomous</option>
          <option value="AUTONOMOUS">Autonomous</option>
        </select>
      </div>
      <div>
        <label htmlFor="verticalMarket" className="block text-sm font-medium text-gray-700">
          Vertical Market
        </label>
        <select
          id="verticalMarket"
          name="verticalMarket"
          defaultValue={defaults?.verticalMarket}
          className="mt-1 w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900"
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
        <label htmlFor="ownerId" className="block text-sm font-medium text-gray-700">
          Owner
        </label>
        <select
          id="ownerId"
          name="ownerId"
          className="mt-1 w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900"
        >
          <option value="">—</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.email}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <input
          id="createAccountability"
          name="createAccountability"
          type="checkbox"
          value="on"
          className="rounded border border-gray-300"
        />
        <label htmlFor="createAccountability" className="text-sm text-gray-700">
          Auto-create AccountabilityAssignment on save
        </label>
      </div>

      {masterDataEntities.length > 0 && <DataSourcesSection entities={masterDataEntities} />}

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        className="bg-navy-600 hover:bg-navy-500 rounded px-4 py-2 text-sm font-medium text-white"
      >
        Create Asset
      </button>
    </form>
  );
}
