"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { HelpCircle, Loader2, X } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { runDiscovery as runDiscoveryClient, type RegulationDiscoveryResult } from "@/lib/discovery/engine";
import {
  ALL_VERTICAL_KEYS,
  VERTICAL_REGULATIONS,
  type VerticalKey
} from "@/lib/vertical-regulations";
import { runDiscovery } from "./actions";
import { GuestResultsView } from "./GuestResultsView";

function LabelWithTooltip({ label, tooltip }: { label: string; tooltip: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span>{label}</span>
      <Tooltip content={tooltip} side="top">
        <HelpCircle className="h-4 w-4 text-slate-400" aria-hidden />
      </Tooltip>
    </span>
  );
}
const ASSET_TYPES = ["MODEL", "AGENT", "APPLICATION", "PIPELINE"] as const;
/** Select label — stored values stay enum tokens for AssetType / discovery APIs */
function assetTypeSelectLabel(t: (typeof ASSET_TYPES)[number]): string {
  const labels: Record<(typeof ASSET_TYPES)[number], string> = {
    MODEL: "Model",
    AGENT: "Agent",
    APPLICATION: "Application",
    PIPELINE: "Workflow"
  };
  return labels[t];
}
const BUSINESS_FUNCTIONS = [
  "HR",
  "Finance",
  "Operations",
  "Customer Service",
  "Healthcare",
  "Legal",
  "Other"
] as const;
const DEPLOYMENTS = ["EU_market", "US_only", "Global", "Internal_only"] as const;
const DEPLOYMENT_LABELS: Record<(typeof DEPLOYMENTS)[number], string> = {
  EU_market: "EU market",
  US_only: "US only",
  Global: "Global",
  Internal_only: "Internal only"
};
const OPERATING_MODELS = ["IAAS", "PAAS", "SAAS", "AGENT_PAAS", "MIXED"] as const;
const OPERATING_MODEL_LABELS: Record<(typeof OPERATING_MODELS)[number], string> = {
  IAAS: "IaaS",
  PAAS: "PaaS",
  SAAS: "SaaS",
  AGENT_PAAS: "Agent PaaS",
  MIXED: "Mixed"
};
const AUTONOMY_LEVELS = ["L0", "L1", "L2", "L3", "L4", "L5"] as const;
const AUTONOMY_DESCRIPTIONS: Record<string, string> = {
  L0: "No automation – human performs all actions",
  L1: "Assisted – AI suggests, human decides",
  L2: "Partial automation – AI executes with human approval",
  L3: "Conditional automation – AI acts within defined scope",
  L4: "High automation – AI operates with limited oversight",
  L5: "Full autonomy – AI operates independently"
};
const DATA_TYPES = [
  "PII",
  "Financial",
  "Health",
  "Biometric",
  "Employment",
  "Public",
  "Proprietary"
] as const;
const RISK_LEVELS = ["Low", "Medium", "High", "Critical"] as const;
const EU_ENTITY_TYPES = [
  "PROVIDER",
  "DEPLOYER",
  "DISTRIBUTOR",
  "IMPORTER",
  "PRODUCT_MANUFACTURER",
  "AUTHORISED_REPRESENTATIVE"
] as const;
const EU_ENTITY_LABELS: Record<(typeof EU_ENTITY_TYPES)[number], string> = {
  PROVIDER: "Provider",
  DEPLOYER: "Deployer",
  DISTRIBUTOR: "Distributor",
  IMPORTER: "Importer",
  PRODUCT_MANUFACTURER: "Product manufacturer",
  AUTHORISED_REPRESENTATIVE: "Authorised representative"
};
const EU_EXCLUSIONS = [
  { value: "none", label: "None of these" },
  { value: "military", label: "Military purposes only" },
  { value: "rd_only", label: "R&D only (not yet on market)" },
  { value: "open_source", label: "Open source component only" },
  { value: "personal_use", label: "Personal, non-professional use" }
] as const;
const EU_TRANSPARENCY_TYPES = [
  { value: "deep_fake", label: "Deep-fake / manipulated image/audio/video" },
  { value: "synthetic_content", label: "Synthetic text/image/audio/video" },
  { value: "emotion_biometric", label: "Emotion recognition or biometric categorisation" },
  { value: "natural_person", label: "Interacts directly with natural persons" }
] as const;

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
  euEntityType: (typeof EU_ENTITY_TYPES)[number] | "" | "NOT_APPLICABLE";
  euEstablishedInEU: boolean;
  euExclusion: (typeof EU_EXCLUSIONS)[number]["value"] | "";
  euTransparencyTypes: string[];
  euNotApplicable: boolean;
};

const STEP_LABELS = ["Scope", "System", "Risk", "Run"] as const;

const getInitialInputs = (
  defaultVerticals: string[],
  defaultOperatingModel: string | null
): WizardInputs => ({
  assetType: "",
  description: "",
  businessFunction: "",
  decisionsAffectingPeople: false,
  interactsWithEndUsers: false,
  deployment: "",
  verticals: defaultVerticals.length > 0 ? [...defaultVerticals] : ["GENERAL"],
  operatingModel: defaultOperatingModel ?? "",
  autonomyLevel: "",
  dataTypes: [],
  euResidentsData: "",
  expectedRiskLevel: "",
  vulnerablePopulations: false,
  euEntityType: "",
  euEstablishedInEU: false,
  euExclusion: "none",
  euTransparencyTypes: [],
  euNotApplicable: false
});

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
  euEntityType?: string;
  euEstablishedInEU?: boolean;
  euExclusion?: string;
  euTransparencyTypes?: string[];
};

type Props = {
  defaultVerticals: string[];
  defaultOperatingModel: string | null;
  isGuest: boolean;
};

export function DiscoveryWizardClient({
  defaultVerticals,
  defaultOperatingModel,
  isGuest
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [maxStepReached, setMaxStepReached] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [guestResults, setGuestResults] = useState<RegulationDiscoveryResult | null>(null);
  const [inputs, setInputs] = useState<WizardInputs>(() =>
    getInitialInputs(defaultVerticals, defaultOperatingModel)
  );

  const startOver = useCallback(() => {
    setStep(1);
    setMaxStepReached(1);
    setGuestResults(null);
    setError(null);
    setValidationErrors([]);
    setInputs(getInitialInputs(defaultVerticals, defaultOperatingModel));
  }, [defaultVerticals, defaultOperatingModel]);

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

  const toggleTransparencyType = (t: string) => {
    setInputs((prev) => ({
      ...prev,
      euTransparencyTypes: prev.euTransparencyTypes.includes(t)
        ? prev.euTransparencyTypes.filter((x) => x !== t)
        : [...prev.euTransparencyTypes, t]
    }));
  };

  const runDiscoveryHandler = useCallback(() => {
    const required = [
      { val: inputs.assetType, label: "AI system type" },
      { val: inputs.businessFunction, label: "Business function" },
      { val: inputs.deployment, label: "Deployment" },
      { val: inputs.autonomyLevel, label: "Autonomy level" },
      ...(inputs.euNotApplicable
        ? []
        : [{ val: inputs.euResidentsData, label: "EU residents data" }]),
      { val: inputs.expectedRiskLevel, label: "Expected risk level" }
    ];
    const missing = required.filter((r) => !r.val);
    if (missing.length > 0) {
      setValidationErrors(missing.map((m) => m.label));
      return;
    }
    setValidationErrors([]);
    setError(null);

    const euTransparencyType = (
      val: string[] | undefined
    ): ("deep_fake" | "synthetic_content" | "emotion_biometric" | "natural_person")[] | undefined =>
      val && val.length > 0
        ? (val as ("deep_fake" | "synthetic_content" | "emotion_biometric" | "natural_person")[])
        : undefined;

    const euPayload = inputs.euNotApplicable
      ? {
          euEntityType: undefined,
          euEstablishedInEU: false,
          euExclusion: undefined,
          euTransparencyTypes: undefined,
          euResidentsData: "No" as const
        }
      : {
          euEntityType:
            inputs.euEntityType && inputs.euEntityType !== "NOT_APPLICABLE"
              ? (inputs.euEntityType as (typeof EU_ENTITY_TYPES)[number])
              : undefined,
          euEstablishedInEU: inputs.euEstablishedInEU || undefined,
          euExclusion:
            inputs.euExclusion && inputs.euExclusion !== "none"
              ? (inputs.euExclusion as "military" | "rd_only" | "open_source" | "personal_use")
              : undefined,
          euTransparencyTypes: euTransparencyType(inputs.euTransparencyTypes),
          euResidentsData: inputs.euResidentsData as "Yes" | "No" | "Unknown"
        };
    if (isGuest) {
      setSaving(true);
      try {
        const result = runDiscoveryClient({
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
          euResidentsData: euPayload.euResidentsData,
          expectedRiskLevel: inputs.expectedRiskLevel as (typeof RISK_LEVELS)[number],
          vulnerablePopulations: inputs.vulnerablePopulations,
          euEntityType: euPayload.euEntityType,
          euEstablishedInEU: euPayload.euEstablishedInEU,
          euExclusion: euPayload.euExclusion,
          euTransparencyTypes: euPayload.euTransparencyTypes
        });
        setGuestResults(result);
      } catch (e) {
        console.error(e);
        setError("Something went wrong. Please try again.");
      } finally {
        setSaving(false);
      }
    } else {
      setSaving(true);
      runDiscovery({
        assetType: inputs.assetType as "MODEL" | "AGENT" | "APPLICATION" | "PIPELINE",
        description: inputs.description || undefined,
        businessFunction: inputs.businessFunction as
          | "HR"
          | "Finance"
          | "Operations"
          | "Customer Service"
          | "Healthcare"
          | "Legal"
          | "Other",
        decisionsAffectingPeople: inputs.decisionsAffectingPeople,
        interactsWithEndUsers: inputs.interactsWithEndUsers,
        deployment: inputs.deployment as
          | "EU_market"
          | "US_only"
          | "Global"
          | "Internal_only",
        verticals: inputs.verticals,
        operatingModel: inputs.operatingModel || undefined,
        autonomyLevel: inputs.autonomyLevel as "L0" | "L1" | "L2" | "L3" | "L4" | "L5",
        dataTypes: inputs.dataTypes,
        euResidentsData: euPayload.euResidentsData,
        expectedRiskLevel: inputs.expectedRiskLevel as "Low" | "Medium" | "High" | "Critical",
        vulnerablePopulations: inputs.vulnerablePopulations,
        euEntityType: euPayload.euEntityType,
        euEstablishedInEU: euPayload.euEstablishedInEU,
        euExclusion: euPayload.euExclusion,
        euTransparencyTypes: euPayload.euTransparencyTypes
      })
        .then((id) => router.push(`/discover/results/${id}`))
        .catch((e) => {
          console.error(e);
          setError("Something went wrong. Please try again.");
        })
        .finally(() => setSaving(false));
    }
  }, [inputs, isGuest, router]);

  if (guestResults) {
    return (
      <div className="discovery-wizard space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <GuestResultsView results={guestResults} onStartOver={startOver} />
      </div>
    );
  }

  return (
    <div className="discovery-wizard space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="space-y-2">
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((s) => {
            const canGo = s <= maxStepReached;
            return (
              <button
                key={s}
                type="button"
                onClick={() => canGo && setStep(s)}
                disabled={!canGo}
                className={`h-2 flex-1 rounded-full transition ${
                  step === s ? "bg-navy-600" : step > s ? "bg-navy-200" : "bg-slate-200"
                } ${!canGo ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                aria-label={`Step ${s}: ${STEP_LABELS[s - 1]}${!canGo ? " (complete earlier steps first)" : ""}`}
              />
            );
          })}
        </div>
        <p className="text-center text-xs text-slate-500">
          {STEP_LABELS[step - 1]} — Step {step} of 4
        </p>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <h2 className="font-medium text-slate-900">Step 1: Scope & Context</h2>
          <p className="text-sm text-slate-600">
            Start with where you operate and which sector you serve. This narrows which regulations
            may apply before we ask about your specific system.
          </p>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              <LabelWithTooltip
                label="Which verticals does your organization operate in?"
                tooltip="Sectors you serve (e.g. healthcare, financial services). Some regulations apply only to specific verticals."
              />
            </label>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
              {ALL_VERTICAL_KEYS.map((v) => (
                <label key={v} className="flex shrink-0 items-center gap-2">
                  <input
                    type="checkbox"
                    checked={inputs.verticals.includes(v)}
                    onChange={() => toggleVertical(v)}
                    className="shrink-0 rounded border-slate-300"
                  />
                  <span className="text-sm whitespace-nowrap">
                    {VERTICAL_REGULATIONS[v]?.label ?? v.replace(/_/g, " ")}
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              <LabelWithTooltip
                label="Where will it be deployed?"
                tooltip="EU market: placed on market or put into service in the EU. US only: US jurisdictions only. Global: worldwide. Internal only: within your organisation."
              />
            </label>
            <select
              value={inputs.deployment}
              onChange={(e) =>
                setInputs((p) => ({
                  ...p,
                  deployment: e.target.value as (typeof DEPLOYMENTS)[number] | ""
                }))
              }
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">— Select deployment —</option>
              {DEPLOYMENTS.map((d) => (
                <option key={d} value={d}>
                  {DEPLOYMENT_LABELS[d] ?? d}
                </option>
              ))}
            </select>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
            <label className="flex cursor-pointer items-start gap-2">
              <input
                type="checkbox"
                checked={inputs.euNotApplicable}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setInputs((p) => ({
                    ...p,
                    euNotApplicable: checked,
                    ...(checked
                      ? {
                          euEstablishedInEU: false,
                          euExclusion: "",
                          euEntityType: "NOT_APPLICABLE" as const,
                          euResidentsData: "No" as const,
                          euTransparencyTypes: [] as string[]
                        }
                      : {})
                  }));
                }}
                className="mt-0.5 shrink-0 rounded border-slate-300"
              />
              <span className="text-sm font-medium text-slate-700">
                EU AI Act does not apply — we are outside EU scope
              </span>
            </label>
            <p className="mt-1 text-xs text-slate-600">
              If you are certain the EU AI Act doesn&apos;t apply to your organisation or this
              system, check above to skip the EU questions below.
            </p>
          </div>
          <div
            className={`space-y-4 transition ${
              inputs.euNotApplicable ? "pointer-events-none opacity-50" : ""
            }`}
          >
            <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              <strong className="text-slate-700">#S1 Scope</strong> – The EU AI Act applies if you
              place AI on the EU market, put it into service in the EU, are established in the EU,
              or if your AI&apos;s output is used in the EU. The questions below help determine
              whether you fall within scope.
            </div>
            <div className="flex items-center gap-4">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={inputs.euEstablishedInEU}
                  onChange={(e) =>
                    setInputs((p) => ({ ...p, euEstablishedInEU: e.target.checked }))
                  }
                  className="rounded border-slate-300"
                />
              <span className="flex items-center gap-1.5 text-sm text-slate-700">
                Organisation established or located in the EU (scope #S1)
                <Tooltip
                  content="If your organisation has a legal presence in any EU member state, the EU AI Act may apply even if the system is deployed elsewhere."
                  side="top"
                >
                  <HelpCircle className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                </Tooltip>
              </span>
            </label>
          </div>
          <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <strong className="text-slate-700">#R2 Exclusions</strong> – Some systems are excluded
            from the EU AI Act (e.g. military AI, purely R&D, certain open source components, or
            personal non-professional use). If one applies, the Act generally does not apply.
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              <LabelWithTooltip
                label="Does your system fall under any exclusions? (#R2)"
                tooltip="Military: AI for defence only. R&D only: not yet on market. Open source: component under free/libre license. Personal use: non-professional deployment by individuals. If any apply, the system may be out of scope."
              />
            </label>
            <select
              value={inputs.euExclusion}
              onChange={(e) =>
                setInputs((p) => ({
                  ...p,
                  euExclusion: e.target.value as (typeof EU_EXCLUSIONS)[number]["value"] | ""
                }))
              }
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">— Select —</option>
              {EU_EXCLUSIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          </div>
          {inputs.euNotApplicable &&
            (inputs.deployment === "EU_market" || inputs.deployment === "Global") && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                You selected EU or Global deployment. If your organisation has any EU presence, the
                EU AI Act may still apply.
              </div>
            )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="font-medium text-slate-900">Step 2: System Description</h2>
          <p className="text-sm text-slate-600">
            Describe the AI system itself: what it is, what it does, and how it operates.
          </p>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              <LabelWithTooltip
                label="What type of AI system?"
                tooltip="Model: a single AI model (e.g. foundation model, fine-tuned). Agent: an autonomous agent that acts on its own. Application: a user-facing app (e.g. chatbot, recommendation system). Workflow: a multi-step flow (e.g. data → model → output)."
              />
            </label>
            <select
              value={inputs.assetType}
              onChange={(e) =>
                setInputs((p) => ({
                  ...p,
                  assetType: e.target.value as (typeof ASSET_TYPES)[number] | ""
                }))
              }
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">— Select type —</option>
              {ASSET_TYPES.map((t) => (
                <option key={t} value={t}>
                  {assetTypeSelectLabel(t)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              <LabelWithTooltip
                label="What does it do? (max 200 chars)"
                tooltip="A brief description helps identify regulations. Include use case, who it serves, and how it works (e.g. 'Chatbot for order status and returns')."
              />
            </label>
            <textarea
              value={inputs.description}
              onChange={(e) =>
                setInputs((p) => ({ ...p, description: e.target.value.slice(0, 200) }))
              }
              maxLength={200}
              rows={2}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              placeholder="e.g. Customer service chatbot for order status"
            />
            <p className="mt-0.5 text-xs text-slate-500">{inputs.description.length}/200</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              <LabelWithTooltip
                label="Which business function?"
                tooltip="The primary organizational area using this AI (e.g. HR for recruitment, Finance for credit scoring). Affects which regulations apply."
              />
            </label>
            <select
              value={inputs.businessFunction}
              onChange={(e) =>
                setInputs((p) => ({
                  ...p,
                  businessFunction: e.target.value as (typeof BUSINESS_FUNCTIONS)[number] | ""
                }))
              }
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">— Select function —</option>
              {BUSINESS_FUNCTIONS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
          <div
            className={`transition ${inputs.euNotApplicable ? "pointer-events-none opacity-50" : ""}`}
          >
            <div className="mb-1.5 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              <strong className="text-slate-700">#E1 Entity type</strong> – The EU AI Act assigns
              different obligations depending on your role. You can be more than one type (e.g. both
              Provider and Deployer). Select the one that best fits, or &quot;Not applicable&quot;
              if the Act doesn&apos;t apply.
            </div>
            <label className="block text-sm font-medium text-slate-700">
              <LabelWithTooltip
                label="EU AI Act entity type (flowchart #E1)"
                tooltip="Select your role under the EU AI Act, or 'Not applicable' if your system is outside EU scope (e.g. US-only, internal use). Provider: develops and places on market. Deployer: uses under your authority. Distributor/Importer: supply chain roles. Product Manufacturer: AI in your product."
              />
            </label>
            <select
              value={inputs.euEntityType}
              onChange={(e) =>
                setInputs((p) => ({
                  ...p,
                  euEntityType: e.target.value as
                    | (typeof EU_ENTITY_TYPES)[number]
                    | ""
                    | "NOT_APPLICABLE"
                }))
              }
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">— Select —</option>
              <option value="NOT_APPLICABLE">Not applicable (outside EU scope)</option>
              {EU_ENTITY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {EU_ENTITY_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              <LabelWithTooltip
                label="Operating model?"
                tooltip="IAAS: infrastructure. PAAS: platform. SAAS: software. AGENT_PAAS: agent platform. MIXED: combination. Affects supply chain and deployment obligations."
              />
            </label>
            <select
              value={inputs.operatingModel}
              onChange={(e) => setInputs((p) => ({ ...p, operatingModel: e.target.value }))}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">— Select operating model —</option>
              {OPERATING_MODELS.map((m) => (
                <option key={m} value={m}>
                  {OPERATING_MODEL_LABELS[m]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              <LabelWithTooltip
                label="Autonomy level?"
                tooltip="L0: human-only. L1: AI suggests, human decides. L2: partial automation. L3: conditional automation. L4: high automation. L5: full autonomy. Higher autonomy may trigger additional oversight requirements."
              />
            </label>
            <select
              value={inputs.autonomyLevel}
              onChange={(e) =>
                setInputs((p) => ({
                  ...p,
                  autonomyLevel: e.target.value as (typeof AUTONOMY_LEVELS)[number] | ""
                }))
              }
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">— Select autonomy level —</option>
              {AUTONOMY_LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}: {AUTONOMY_DESCRIPTIONS[l]}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h2 className="font-medium text-slate-900">Step 3: Impact & Risk</h2>
          <p className="text-sm text-slate-600">
            Describe how the system affects people, what data it uses, and your initial risk
            assessment. This helps prioritise and tailor the regulations we surface.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-2">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={inputs.decisionsAffectingPeople}
                onChange={(e) =>
                  setInputs((p) => ({ ...p, decisionsAffectingPeople: e.target.checked }))
                }
                className="rounded border-slate-300"
              />
              <span className="flex items-center gap-1.5 text-sm text-slate-700">
                Will it make or influence decisions affecting people?
                <Tooltip
                  content="e.g. hiring, credit, benefits, access to services. Triggers higher scrutiny under EU AI Act and employment regulations."
                  side="top"
                >
                  <HelpCircle className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                </Tooltip>
              </span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={inputs.interactsWithEndUsers}
                onChange={(e) =>
                  setInputs((p) => ({ ...p, interactsWithEndUsers: e.target.checked }))
                }
                className="rounded border-slate-300"
              />
              <span className="flex items-center gap-1.5 text-sm text-slate-700">
                Will it interact directly with end users?
                <Tooltip
                  content="e.g. chatbots, virtual assistants, recommendation UIs. Often triggers transparency obligations (Art. 50)."
                  side="top"
                >
                  <HelpCircle className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                </Tooltip>
              </span>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              <LabelWithTooltip
                label="What data will it process?"
                tooltip="PII: personally identifiable. Financial, Health, Biometric: sensitive categories. Employment: job-related. Public: open data. Proprietary: internal. Affects GDPR, sector rules."
              />
            </label>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
              {DATA_TYPES.map((d) => (
                <label key={d} className="flex shrink-0 items-center gap-2">
                  <input
                    type="checkbox"
                    checked={inputs.dataTypes.includes(d)}
                    onChange={() => toggleDataType(d)}
                    className="shrink-0 rounded border-slate-300"
                  />
                  <span className="text-sm whitespace-nowrap">{d}</span>
                </label>
              ))}
            </div>
          </div>
          <div
            className={`space-y-4 transition ${
              inputs.euNotApplicable ? "pointer-events-none opacity-50" : ""
            }`}
          >
            <div>
              <label className="block text-sm font-medium text-slate-700">
                <LabelWithTooltip
                  label="Does it process data about EU residents?"
                  tooltip="Yes: output used in EU or processes EU persons' data — EU regulations apply. No: no EU link. Unknown: may apply; treat as likely."
                />
              </label>
              <select
                value={inputs.euResidentsData}
                onChange={(e) =>
                  setInputs((p) => ({
                    ...p,
                    euResidentsData: e.target.value as "Yes" | "No" | "Unknown" | ""
                  }))
                }
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">— Select —</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
                <option value="Unknown">Unknown</option>
              </select>
            </div>
            <div>
              <div className="mb-1.5 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                <strong className="text-slate-700">#R4 Art. 50 Transparency</strong> – Limited-risk AI
                systems must inform users when they interact with AI. Art. 50 sets disclosure rules
                for: (1) deep-fakes / manipulated media, (2) synthetic content, (3) emotion
                recognition or biometric categorisation, (4) AI that interacts directly with people.
                Tick all that apply.
              </div>
              <label className="block text-sm font-medium text-slate-700">
                <LabelWithTooltip
                  label="Transparency triggers (#R4 – Art. 50)"
                  tooltip="EU AI Act requires disclosure for: deep-fakes, synthetic content, emotion/biometric categorisation, and AI that interacts directly with people. Tick all that apply."
                />
              </label>
              <p className="mt-0.5 text-xs text-slate-500">
                Tick if your system performs any of these (limited-risk obligations)
              </p>
              <div className="mt-2 flex flex-col gap-2">
                {EU_TRANSPARENCY_TYPES.map((t) => (
                  <label key={t.value} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={inputs.euTransparencyTypes.includes(t.value)}
                      onChange={() => toggleTransparencyType(t.value)}
                      className="shrink-0 rounded border-slate-300"
                    />
                    <span className="text-sm">{t.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              <LabelWithTooltip
                label="Expected risk level?"
                tooltip="Your initial assessment: Low (minimal harm), Medium, High (significant impact), Critical (severe harm). Helps prioritise discovery results."
              />
            </label>
            <select
              value={inputs.expectedRiskLevel}
              onChange={(e) =>
                setInputs((p) => ({
                  ...p,
                  expectedRiskLevel: e.target.value as (typeof RISK_LEVELS)[number] | ""
                }))
              }
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">— Select risk level —</option>
              {RISK_LEVELS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={inputs.vulnerablePopulations}
                onChange={(e) =>
                  setInputs((p) => ({ ...p, vulnerablePopulations: e.target.checked }))
                }
                className="rounded border-slate-300"
              />
              <span className="flex items-center gap-1.5 text-sm text-slate-700">
                Will vulnerable populations be affected?
                <Tooltip
                  content="e.g. children, elderly, persons with disabilities, or others at greater risk. May require extra safeguards and monitoring."
                  side="top"
                >
                  <HelpCircle className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                </Tooltip>
              </span>
            </label>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <h2 className="font-medium text-slate-900">Step 4: Run Discovery</h2>
          {validationErrors.length > 0 && (
            <div className="flex items-start justify-between gap-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <div>
                <p className="font-medium">Please complete before running:</p>
                <ul className="mt-1 list-inside list-disc">
                  {validationErrors.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </div>
              <button
                type="button"
                onClick={() => setValidationErrors([])}
                className="shrink-0 rounded p-1 hover:bg-amber-100"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-medium text-slate-800">Summary</h3>
            <dl className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-slate-500">Verticals</dt>
                <dd>
                  {inputs.verticals.length > 0
                    ? inputs.verticals
                        .map((v) => VERTICAL_REGULATIONS[v as VerticalKey]?.label ?? v)
                        .join(", ")
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Deployment</dt>
                <dd>{inputs.deployment ? DEPLOYMENT_LABELS[inputs.deployment] ?? inputs.deployment : "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">System type</dt>
                <dd>
                  {inputs.assetType
                    ? assetTypeSelectLabel(inputs.assetType as (typeof ASSET_TYPES)[number])
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Risk level</dt>
                <dd>{inputs.expectedRiskLevel || "—"}</dd>
              </div>
            </dl>
            <p className="mt-2 text-xs text-slate-500">
              Go back to any step to change your answers before running.
            </p>
          </div>
          {isGuest ? (
            <>
              <div className="border-navy-200 bg-navy-50/50 rounded-lg border p-4">
                <h3 className="text-navy-900 font-medium">Save your results</h3>
                <p className="text-navy-700 mt-1 text-sm">
                  Create a free account to save your assessment, get your full maturity score, and
                  see your personalized readiness roadmap.
                </p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/login?callbackUrl=/discover/wizard"
                    className="bg-navy-600 hover:bg-navy-500 inline-flex items-center justify-center rounded-lg px-4 py-3 text-sm font-medium text-white"
                  >
                    Create free account to save
                  </Link>
                  <button
                    type="button"
                    onClick={runDiscoveryHandler}
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      "Continue as guest"
                    )}
                  </button>
                </div>
                <p className="text-navy-600 mt-2 text-xs">
                  As a guest, you&apos;ll see partial results. Create an account for the full
                  control list, evidence requirements, and implementation roadmap.
                </p>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-600">
                Click below to run the discovery engine and see applicable regulations. Results will
                be saved.
              </p>
              <button
                type="button"
                onClick={runDiscoveryHandler}
                disabled={saving}
                className="bg-navy-600 hover:bg-navy-500 flex w-full items-center justify-center gap-2 rounded px-4 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Running discovery…
                  </>
                ) : (
                  "Run discovery & view results"
                )}
              </button>
            </>
          )}
        </div>
      )}

      <div className="relative z-20 flex shrink-0 justify-between border-t border-slate-200 pt-4">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
          className="shrink-0 rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Back
        </button>
        {step < 4 ? (
          <button
            type="button"
            onClick={() => {
              const next = Math.min(4, step + 1);
              setStep(next);
              setMaxStepReached((m) => Math.max(m, next));
              if (next === 4) setValidationErrors([]);
            }}
            className="bg-navy-600 hover:bg-navy-500 relative z-10 shrink-0 cursor-pointer rounded px-4 py-2 text-sm font-medium text-white"
          >
            Next
          </button>
        ) : null}
      </div>
    </div>
  );
}
