"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { HelpCircle, Loader2 } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { runDiscovery, type RegulationDiscoveryResult } from "@/lib/discovery/engine";
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
};

const VERTICAL_OPTIONS = [
  "GENERAL",
  "FINANCIAL_SERVICES",
  "HEALTHCARE",
  "INSURANCE",
  "PUBLIC_SECTOR",
  "ENERGY",
  "HR_SERVICES"
];

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
  euExclusion: "",
  euTransparencyTypes: []
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
  const [error, setError] = useState<string | null>(null);
  const [guestResults, setGuestResults] = useState<RegulationDiscoveryResult | null>(null);
  const [inputs, setInputs] = useState<WizardInputs>(() =>
    getInitialInputs(defaultVerticals, defaultOperatingModel)
  );

  const startOver = useCallback(() => {
    setStep(1);
    setGuestResults(null);
    setError(null);
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
      { val: inputs.euResidentsData, label: "EU residents data" },
      { val: inputs.expectedRiskLevel, label: "Expected risk level" }
    ];
    const missing = required.filter((r) => !r.val);
    if (missing.length > 0) {
      alert(`Please complete: ${missing.map((m) => m.label).join(", ")}`);
      return;
    }
    setError(null);
    if (isGuest) {
      setSaving(true);
      try {
        const result = runDiscovery({
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
          vulnerablePopulations: inputs.vulnerablePopulations,
          euEntityType:
            inputs.euEntityType && inputs.euEntityType !== "NOT_APPLICABLE"
              ? (inputs.euEntityType as (typeof EU_ENTITY_TYPES)[number])
              : undefined,
          euEstablishedInEU: inputs.euEstablishedInEU || undefined,
          euExclusion:
            inputs.euExclusion && inputs.euExclusion !== "none"
              ? (inputs.euExclusion as "military" | "rd_only" | "open_source" | "personal_use")
              : undefined,
          euTransparencyTypes:
            inputs.euTransparencyTypes.length > 0
              ? (inputs.euTransparencyTypes as (
                  | "deep_fake"
                  | "synthetic_content"
                  | "emotion_biometric"
                  | "natural_person"
                )[])
              : undefined
        });
        setGuestResults(result);
      } catch (e) {
        console.error(e);
        setError("Something went wrong. Please try again.");
      } finally {
        setSaving(false);
      }
    } else if (runDiscoveryAuthenticated) {
      setSaving(true);
      runDiscoveryAuthenticated({
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
        vulnerablePopulations: inputs.vulnerablePopulations,
        euEntityType:
          inputs.euEntityType && inputs.euEntityType !== "NOT_APPLICABLE"
            ? inputs.euEntityType
            : undefined,
        euEstablishedInEU: inputs.euEstablishedInEU || undefined,
        euExclusion:
          inputs.euExclusion && inputs.euExclusion !== "none" ? inputs.euExclusion : undefined,
        euTransparencyTypes:
          inputs.euTransparencyTypes.length > 0 ? inputs.euTransparencyTypes : undefined
      } as DiscoveryInputs)
        .then((id) => router.push(`/discover/results/${id}`))
        .catch((e) => {
          console.error(e);
          setError("Something went wrong. Please try again.");
        })
        .finally(() => setSaving(false));
    }
  }, [inputs, isGuest, runDiscoveryAuthenticated, router]);

  if (guestResults) {
    return (
      <div className="discovery-wizard space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <GuestResultsView results={guestResults} onStartOver={startOver} />
      </div>
    );
  }

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
            <label className="block text-sm font-medium text-slate-700">
              <LabelWithTooltip
                label="What type of AI system?"
                tooltip="MODEL: a single AI model (e.g. foundation model, fine-tuned). AGENT: an autonomous agent that acts on its own. APPLICATION: a user-facing app (e.g. chatbot, recommendation system). PIPELINE: a multi-step workflow (e.g. data → model → output)."
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
                  {t}
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
          <div>
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
                  {t.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-4">
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
          </div>
          <div className="flex items-center gap-4">
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
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="font-medium text-slate-900">Step 2: Deployment Context</h2>
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
          <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <strong className="text-slate-700">#S1 Scope</strong> – The EU AI Act applies if you
            place AI on the EU market, put it into service in the EU, are established in the EU, or
            if your AI&apos;s output is used in the EU. The questions below help determine whether
            you fall within scope.
          </div>
          <div className="flex items-center gap-4">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={inputs.euEstablishedInEU}
                onChange={(e) => setInputs((p) => ({ ...p, euEstablishedInEU: e.target.checked }))}
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
          <div>
            <label className="block text-sm font-medium text-slate-700">
              <LabelWithTooltip
                label="Which verticals does your organization operate in?"
                tooltip="Sectors you serve (e.g. healthcare, financial services). Some regulations apply only to specific verticals."
              />
            </label>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
              {VERTICAL_OPTIONS.map((v) => (
                <label key={v} className="flex shrink-0 items-center gap-2">
                  <input
                    type="checkbox"
                    checked={inputs.verticals.includes(v)}
                    onChange={() => toggleVertical(v)}
                    className="shrink-0 rounded border-slate-300"
                  />
                  <span className="text-sm whitespace-nowrap">{v.replace(/_/g, " ")}</span>
                </label>
              ))}
            </div>
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
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              <LabelWithTooltip
                label="Autonomy level?"
                tooltip="L0: human-only. L1: AI suggests, human decides. L2: partial automation. L3: conditional automation. L4: high automation. L5: full autonomy. Higher autonomy may trigger additional governance."
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
          <h2 className="font-medium text-slate-900">Step 3: Data & Risk Profile</h2>
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
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}
          {isGuest ? (
            <>
              <div className="border-navy-200 bg-navy-50/50 rounded-lg border p-4">
                <h3 className="text-navy-900 font-medium">Save your results</h3>
                <p className="text-navy-700 mt-1 text-sm">
                  Create a free account to save your assessment, get your full maturity score, and
                  see your personalized governance roadmap.
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
            className="bg-navy-600 hover:bg-navy-500 rounded px-4 py-2 text-sm font-medium text-white"
          >
            Next
          </button>
        ) : null}
      </div>
    </div>
  );
}
