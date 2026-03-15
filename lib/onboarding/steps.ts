/**
 * Onboarding wizard steps – definitions for the 5-step flow.
 */

import { ALL_VERTICAL_KEYS, VERTICAL_REGULATIONS } from "@/lib/vertical-regulations";
import type { VerticalKey } from "@/lib/vertical-regulations";

export type OnboardingStepId = 1 | 2 | 3 | 4 | 5;

export type OnboardingStep = {
  id: OnboardingStepId;
  title: string;
  description: string;
  estimatedMinutes: number;
  requiredFields: string[];
};

/** Operating model options – CoSAI shared responsibility matrix applies per selection */
export const OPERATING_MODELS = [
  { value: "IAAS", label: "IaaS (Infrastructure as a Service)", description: "You manage models, data, and applications on vendor infrastructure" },
  { value: "PAAS", label: "PaaS (Platform as a Service)", description: "You build on vendor ML platform; they manage infra" },
  { value: "AGENT_PAAS", label: "Agent-PaaS", description: "You deploy agents on vendor agent platform" },
  { value: "SAAS", label: "SaaS (Software as a Service)", description: "Vendor provides end-to-end AI application" },
  { value: "MIXED", label: "Mixed", description: "Combination of models across delivery types" }
] as const;

export type OperatingModelValue = (typeof OPERATING_MODELS)[number]["value"];

/** Org size options */
export const ORG_SIZES = [
  { value: "SMALL", label: "< 100 employees" },
  { value: "MEDIUM", label: "100–1,000 employees" },
  { value: "LARGE", label: "1,000–10,000 employees" },
  { value: "ENTERPRISE", label: "10,000+ employees" }
] as const;

export type OrgSizeValue = (typeof ORG_SIZES)[number]["value"];

/** Vertical keys for Step 2 – from VERTICAL_REGULATIONS */
export const VERTICAL_OPTIONS: { value: VerticalKey; label: string }[] = ALL_VERTICAL_KEYS.map((key) => ({
  value: key,
  label: VERTICAL_REGULATIONS[key]?.label ?? key.replace(/_/g, " ")
}));

/** Quick maturity check – one question per layer (L1-1, L2-1, L3-1, L4-1, L5-1) */
export const QUICK_MATURITY_QUESTION_IDS = ["L1-1", "L2-1", "L3-1", "L4-1", "L5-1"] as const;

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 1,
    title: "Organization Profile",
    description: "Tell us about your organization and primary AI use case.",
    estimatedMinutes: 2,
    requiredFields: ["name", "orgSize", "primaryUseCase"]
  },
  {
    id: 2,
    title: "Vertical & Regulatory Scope",
    description: "Select the verticals you serve. Applicable regulations will be shown in real time.",
    estimatedMinutes: 3,
    requiredFields: ["clientVerticals"]
  },
  {
    id: 3,
    title: "Operating Model",
    description: "Choose your AI delivery model. The CoSAI shared responsibility matrix will be shown for your selection.",
    estimatedMinutes: 2,
    requiredFields: ["operatingModel"]
  },
  {
    id: 4,
    title: "First AI Asset",
    description: "Register your first AI asset to get started.",
    estimatedMinutes: 3,
    requiredFields: ["assetName", "assetType", "euRiskLevel", "autonomyLevel"]
  },
  {
    id: 5,
    title: "Quick Maturity Check",
    description: "Answer 5 questions (one per CoSAI layer) to establish your baseline maturity.",
    estimatedMinutes: 5,
    requiredFields: ["answers"]
  }
];

export function getStep(id: OnboardingStepId): OnboardingStep | undefined {
  return ONBOARDING_STEPS.find((s) => s.id === id);
}

export function getStepUrl(step: OnboardingStepId): string {
  return `/onboarding/${step}`;
}
