"use client";

import { useState } from "react";
import { saveStep4 } from "./actions";

const ASSET_TYPES = [
  { value: "MODEL", label: "Model" },
  { value: "AGENT", label: "Agent" },
  { value: "APPLICATION", label: "Application" },
  { value: "PIPELINE", label: "Pipeline" },
  { value: "DATASET", label: "Dataset" }
] as const;

const EU_RISK_LEVELS = [
  {
    value: "MINIMAL",
    label: "Minimal",
    desc: "No significant risk of harm. General-purpose AI (e.g. spam filters, recommendations)."
  },
  {
    value: "LIMITED",
    label: "Limited",
    desc: "Limited risk. Transparency obligations apply (e.g. chatbots must disclose they are AI)."
  },
  {
    value: "HIGH",
    label: "High",
    desc: "Annex III use cases: credit scoring, HR, critical infrastructure, education, etc. Conformity assessment required."
  },
  {
    value: "UNACCEPTABLE",
    label: "Unacceptable",
    desc: "Prohibited: social scoring, manipulative subliminal techniques, exploitation of vulnerabilities."
  }
] as const;

const AUTONOMY_LEVELS = [
  { value: "HUMAN_ONLY", label: "Human only" },
  { value: "ASSISTED", label: "Assisted" },
  { value: "SEMI_AUTONOMOUS", label: "Semi-autonomous" },
  { value: "AUTONOMOUS", label: "Autonomous" }
] as const;

type Props = {
  onNext: () => void;
  isPending: boolean;
};

export function Step4FirstAsset({ onNext, isPending }: Props) {
  const [name, setName] = useState("");
  const [assetType, setAssetType] = useState("MODEL");
  const [euRiskLevel, setEuRiskLevel] = useState("LIMITED");
  const [autonomyLevel, setAutonomyLevel] = useState("ASSISTED");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveStep4({
      assetName: name,
      assetType: assetType as
        | "MODEL"
        | "PROMPT"
        | "AGENT"
        | "DATASET"
        | "APPLICATION"
        | "TOOL"
        | "PIPELINE",
      euRiskLevel: euRiskLevel as "MINIMAL" | "LIMITED" | "HIGH" | "UNACCEPTABLE",
      autonomyLevel: autonomyLevel as "HUMAN_ONLY" | "ASSISTED" | "SEMI_AUTONOMOUS" | "AUTONOMOUS"
    });
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div>
            <label htmlFor="assetName" className="block text-sm font-medium text-slate-700">
              Asset name
            </label>
            <input
              id="assetName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="focus:border-navy-500 focus:ring-navy-500 mt-1 w-full rounded border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:ring-1 focus:outline-none"
              placeholder="e.g. Customer support chatbot"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Asset type</label>
            <select
              value={assetType}
              onChange={(e) => setAssetType(e.target.value)}
              className="focus:border-navy-500 focus:ring-navy-500 mt-1 w-full rounded border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:ring-1 focus:outline-none"
            >
              {ASSET_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">EU AI Act risk level</label>
            <div className="mt-2 space-y-2">
              {EU_RISK_LEVELS.map((r) => (
                <label
                  key={r.value}
                  className={`flex cursor-pointer rounded-lg border p-3 ${
                    euRiskLevel === r.value
                      ? "border-navy-500 bg-navy-50 ring-navy-500 ring-1"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="euRiskLevel"
                    value={r.value}
                    checked={euRiskLevel === r.value}
                    onChange={() => setEuRiskLevel(r.value)}
                    className="sr-only"
                  />
                  <div>
                    <span className="font-medium text-slate-900">{r.label}</span>
                    <p className="mt-0.5 text-xs text-slate-600">{r.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Autonomy level</label>
            <select
              value={autonomyLevel}
              onChange={(e) => setAutonomyLevel(e.target.value)}
              className="focus:border-navy-500 focus:ring-navy-500 mt-1 w-full rounded border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:ring-1 focus:outline-none"
            >
              {AUTONOMY_LEVELS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h3 className="text-sm font-medium text-amber-800">Why this matters</h3>
          <p className="mt-2 text-sm text-amber-700">
            The EU AI Act classifies AI systems by risk. <strong>Minimal</strong> and{" "}
            <strong>Limited</strong> have lighter obligations. <strong>High-risk</strong> systems
            (Annex III) require conformity assessment, risk management, data governance, and human
            oversight.
            <strong> Unacceptable</strong> systems are prohibited.
          </p>
          <p className="mt-2 text-sm text-amber-700">
            Getting the classification right from the start helps you plan compliance and avoid
            costly rework.
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="bg-navy-600 hover:bg-navy-500 rounded px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Next"}
        </button>
      </div>
    </form>
  );
}
