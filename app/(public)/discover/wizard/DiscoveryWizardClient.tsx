"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { runDiscoveryGuest } from "./actions";
const ASSET_TYPES = ["MODEL", "AGENT", "APPLICATION", "PIPELINE"] as const;
const BUSINESS_FUNCTIONS = ["HR", "Finance", "Operations", "Customer Service", "Healthcare", "Legal", "Other"] as const;
const DEPLOYMENTS = ["EU_market", "US_only", "Global", "Internal_only"] as const;
const DEPLOYMENT_LABELS: Record<string, string> = {
  EU_market: "EU market",
  US_only: "US only",
  Global: "Global",
  Internal_only: "Internal only"
};
const OPERATING_MODELS = ["IAAS", "PAAS", "SAAS", "AGENT_PAAS", "MIXED"] as const;
const AUTONOMY_LEVELS = ["L0", "L1", "L2", "L3", "L4", "L5"] as const;
const AUTONOMY_DESCRIPTIONS: Record<string, string> = {
  L0: "No automation – human performs all actions",
  L1: "Assisted – AI suggests, human decides",
  L2: "Partial automation – AI executes with human approval",
  L3: "Conditional automation – AI acts within defined scope",
  L4: "High automation – AI operates with limited oversight",
  L5: "Full autonomy – AI operates independently"
};
const DATA_TYPES = ["PII", "Financial", "Health", "Biometric", "Employment", "Public", "Proprietary"] as const;
const RISK_LEVELS = ["Low", "Medium", "High", "Critical"] as const;

type WizardInputs = {
  assetType: (typeof ASSET_TYPES)[number] | "";
  description: string;
  businessFunction: (typeof BUSINESS_FUNCTIONS)[number] | "";
  decisionsAffectingPeople: boolean;
  interactsWithEndUsers: boolean;
  deployment: (typeof DEPLOYMENTS)[number] | "";
  verticals: string[];
  operatingModel: string;
  autonomyLevel: (typeof AUTONOMY_LEVELS)[number] | "";
  dataTypes: string[];
  euResidentsData: "Yes" | "No" | "Unknown" | "";
  expectedRiskLevel: (typeof RISK_LEVELS)[number] | "";
  vulnerablePopulations: boolean;
};

const VERTICAL_OPTIONS = ["GENERAL", "FINANCIAL_SERVICES", "HEALTHCARE", "INSURANCE", "PUBLIC_SECTOR", "ENERGY", "HR_SERVICES"];

const GUEST_STORAGE_KEY = "guestDiscoveryResults";

type DiscoveryInputs = {
  assetType: string;
  description?: string;
  businessFunction: string;
  decisionsAffectingPeople: boolean;
  interactsWithEndUsers: boolean;
  deployment: string;
  verticals: string[];
  operatingModel?: string;
  autonomyLevel: string;
  dataTypes: string[];
  euResidentsData: string;
  expectedRiskLevel: string;
  vulnerablePopulations: boolean;
};

type Props = {
  defaultVerticals: string[];
  defaultOperatingModel: string | null;
  isGuest: boolean;
  runDiscoveryAuthenticated?: (inputs: DiscoveryInputs) => Promise<string>;
};

export function DiscoveryWizardClient({
  defaultVerticals,
  defaultOperatingModel,
  isGuest,
  runDiscoveryAuthenticated
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [inputs, setInputs] = useState<WizardInputs>(() => ({
    assetType: "APPLICATION",
    description: "",
    businessFunction: "Other",
    decisionsAffectingPeople: false,
    interactsWithEndUsers: false,
    deployment: "Global",
    verticals: defaultVerticals.length > 0 ? defaultVerticals : ["GENERAL"],
    operatingModel: defaultOperatingModel ?? "MIXED",
    autonomyLevel: "L2",
    dataTypes: [],
    euResidentsData: "Unknown",
    expectedRiskLevel: "Medium",
    vulnerablePopulations: false
  }));

  const toggleVertical = (v: string) => {
    setInputs((prev) => ({
      ...prev,
      verticals: prev.verticals.includes(v)
        ? prev.verticals.filter((x) => x !== v)
        : [...prev.verticals, v]
    }));
  };

  const toggleDataType = (d: string) => {
    setInputs((prev) => ({
      ...prev,
      dataTypes: prev.dataTypes.includes(d)
        ? prev.dataTypes.filter((x) => x !== d)
        : [...prev.dataTypes, d]
    }));
  };

  const runDiscovery = async () => {
    const required = [
      { val: inputs.assetType, label: "AI system type" },
      { val: inputs.businessFunction, label: "Business function" },
      { val: inputs.deployment, label: "Deployment" },
      { val: inputs.autonomyLevel, label: "Autonomy level" },
      { val: inputs.euResidentsData, label: "EU residents data" },
      { val: inputs.expectedRiskLevel, label: "Expected risk level" }
    ];
    const missing = required.filter((r) => !r.val);
    if (missing.length > 0) {
      alert(`Please complete: ${missing.map((m) => m.label).join(", ")}`);
      return;
    }
    setSaving(true);
    try {
      if (isGuest) {
        const results = await runDiscoveryGuest({
          assetType: inputs.assetType as (typeof ASSET_TYPES)[number],
          description: inputs.description || undefined,
          businessFunction: inputs.businessFunction as (typeof BUSINESS_FUNCTIONS)[number],
          decisionsAffectingPeople: inputs.decisionsAffectingPeople,
          interactsWithEndUsers: inputs.interactsWithEndUsers,
          deployment: inputs.deployment as (typeof DEPLOYMENTS)[number],
          verticals: inputs.verticals,
          operatingModel: inputs.operatingModel || undefined,
          autonomyLevel: inputs.autonomyLevel as (typeof AUTONOMY_LEVELS)[number],
          dataTypes: inputs.dataTypes,
          euResidentsData: inputs.euResidentsData as "Yes" | "No" | "Unknown",
          expectedRiskLevel: inputs.expectedRiskLevel as (typeof RISK_LEVELS)[number],
          vulnerablePopulations: inputs.vulnerablePopulations
        });
        if (typeof window !== "undefined") {
          sessionStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(results));
        }
        router.push("/discover/results/guest");
      } else if (runDiscoveryAuthenticated) {
        const id = await runDiscoveryAuthenticated({
          assetType: inputs.assetType,
          description: inputs.description || undefined,
          businessFunction: inputs.businessFunction,
          decisionsAffectingPeople: inputs.decisionsAffectingPeople,
          interactsWithEndUsers: inputs.interactsWithEndUsers,
          deployment: inputs.deployment,
          verticals: inputs.verticals,
          operatingModel: inputs.operatingModel || undefined,
          autonomyLevel: inputs.autonomyLevel,
          dataTypes: inputs.dataTypes,
          euResidentsData: inputs.euResidentsData,
          expectedRiskLevel: inputs.expectedRiskLevel,
          vulnerablePopulations: inputs.vulnerablePopulations
        } as DiscoveryInputs);
        router.push(`/discover/results/${id}`);
      }
    } catch (e) {
      console.error(e);
      setSaving(false);
    }
  };

  return (
    <div className="discovery-wizard space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStep(s)}
            className={`h-2 flex-1 rounded-full transition ${
              step === s ? "bg-navy-600" : step > s ? "bg-navy-200" : "bg-slate-200"
            }`}
            aria-label={`Step ${s}`}
          />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <h2 className="font-medium text-slate-900">Step 1: System Description</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700">What type of AI system?</label>
            <select
              value={inputs.assetType}
              onChange={(e) => setInputs((p) => ({ ...p, assetType: e.target.value as (typeof ASSET_TYPES)[number] | "" }))}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">— Select type —</option>
              {ASSET_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">What does it do? (max 200 chars)</label>
            <textarea
              value={inputs.description}
              onChange={(e) => setInputs((p) => ({ ...p, description: e.target.value.slice(0, 200) }))}
              maxLength={200}
              rows={2}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              placeholder="e.g. Customer service chatbot for order status"
            />
            <p className="mt-0.5 text-xs text-slate-500">{inputs.description.length}/200</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Which business function?</label>
            <select
              value={inputs.businessFunction}
              onChange={(e) => setInputs((p) => ({ ...p, businessFunction: e.target.value as (typeof BUSINESS_FUNCTIONS)[number] | "" }))}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">— Select function —</option>
              {BUSINESS_FUNCTIONS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={inputs.decisionsAffectingPeople}
                onChange={(e) => setInputs((p) => ({ ...p, decisionsAffectingPeople: e.target.checked }))}
                className="rounded border-slate-300"
              />
              <span className="text-sm text-slate-700">Will it make or influence decisions affecting people?</span>
            </label>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={inputs.interactsWithEndUsers}
                onChange={(e) => setInputs((p) => ({ ...p, interactsWithEndUsers: e.target.checked }))}
                className="rounded border-slate-300"
              />
              <span className="text-sm text-slate-700">Will it interact directly with end users?</span>
            </label>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="font-medium text-slate-900">Step 2: Deployment Context</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700">Where will it be deployed?</label>
            <select
              value={inputs.deployment}
              onChange={(e) => setInputs((p) => ({ ...p, deployment: e.target.value as (typeof DEPLOYMENTS)[number] | "" }))}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">— Select deployment —</option>
              {DEPLOYMENTS.map((d) => (
                <option key={d} value={d}>{DEPLOYMENT_LABELS[d] ?? d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Which verticals does your organization operate in?</label>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
              {VERTICAL_OPTIONS.map((v) => (
                <label key={v} className="flex shrink-0 items-center gap-2">
                  <input
                    type="checkbox"
                    checked={inputs.verticals.includes(v)}
                    onChange={() => toggleVertical(v)}
                    className="shrink-0 rounded border-slate-300"
                  />
                  <span className="whitespace-nowrap text-sm">{v.replace(/_/g, " ")}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Operating model?</label>
            <select
              value={inputs.operatingModel}
              onChange={(e) => setInputs((p) => ({ ...p, operatingModel: e.target.value }))}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">— Select operating model —</option>
              {OPERATING_MODELS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Autonomy level?</label>
            <select
              value={inputs.autonomyLevel}
              onChange={(e) => setInputs((p) => ({ ...p, autonomyLevel: e.target.value as (typeof AUTONOMY_LEVELS)[number] | "" }))}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">— Select autonomy level —</option>
              {AUTONOMY_LEVELS.map((l) => (
                <option key={l} value={l}>{l}: {AUTONOMY_DESCRIPTIONS[l]}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h2 className="font-medium text-slate-900">Step 3: Data & Risk Profile</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700">What data will it process?</label>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
              {DATA_TYPES.map((d) => (
                <label key={d} className="flex shrink-0 items-center gap-2">
                  <input
                    type="checkbox"
                    checked={inputs.dataTypes.includes(d)}
                    onChange={() => toggleDataType(d)}
                    className="shrink-0 rounded border-slate-300"
                  />
                  <span className="whitespace-nowrap text-sm">{d}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Does it process data about EU residents?</label>
            <select
              value={inputs.euResidentsData}
              onChange={(e) => setInputs((p) => ({ ...p, euResidentsData: e.target.value as "Yes" | "No" | "Unknown" | "" }))}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">— Select —</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
              <option value="Unknown">Unknown</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Expected risk level?</label>
            <select
              value={inputs.expectedRiskLevel}
              onChange={(e) => setInputs((p) => ({ ...p, expectedRiskLevel: e.target.value as (typeof RISK_LEVELS)[number] | "" }))}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">— Select risk level —</option>
              {RISK_LEVELS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={inputs.vulnerablePopulations}
                onChange={(e) => setInputs((p) => ({ ...p, vulnerablePopulations: e.target.checked }))}
                className="rounded border-slate-300"
              />
              <span className="text-sm text-slate-700">Will vulnerable populations be affected?</span>
            </label>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <h2 className="font-medium text-slate-900">Step 4: Run Discovery</h2>
          {isGuest ? (
            <>
              <div className="rounded-lg border border-navy-200 bg-navy-50/50 p-4">
                <h3 className="font-medium text-navy-900">Save your results</h3>
                <p className="mt-1 text-sm text-navy-700">
                  Create a free account to save your assessment, get your full maturity score, and see your
                  personalized governance roadmap.
                </p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/login?callbackUrl=/discover/wizard"
                    className="inline-flex items-center justify-center rounded-lg bg-navy-600 px-4 py-3 text-sm font-medium text-white hover:bg-navy-500"
                  >
                    Create free account to save
                  </Link>
                  <button
                    type="button"
                    onClick={runDiscovery}
                    disabled={saving}
                    className="rounded-lg border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    {saving ? "Running…" : "Continue as guest"}
                  </button>
                </div>
                <p className="mt-2 text-xs text-navy-600">
                  As a guest, you&apos;ll see partial results. Create an account for the full control list,
                  evidence requirements, and implementation roadmap.
                </p>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-600">
                Click below to run the discovery engine and see applicable regulations. Results will be saved.
              </p>
              <button
                type="button"
                onClick={runDiscovery}
                disabled={saving || !runDiscoveryAuthenticated}
                className="w-full rounded bg-navy-600 px-4 py-3 text-sm font-medium text-white hover:bg-navy-500 disabled:opacity-50"
              >
                {saving ? "Running discovery…" : "Run discovery & view results"}
              </button>
            </>
          )}
        </div>
      )}

      <div className="flex justify-between border-t border-slate-200 pt-4">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
          className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Back
        </button>
        {step < 4 ? (
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(4, s + 1))}
            className="rounded bg-navy-600 px-4 py-2 text-sm font-medium text-white hover:bg-navy-500"
          >
            Next
          </button>
        ) : null}
      </div>
    </div>
  );
}

export { GUEST_STORAGE_KEY };
