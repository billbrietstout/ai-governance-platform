"use client";

import { Tooltip } from "./Tooltip";

const TERM_DEFINITIONS: Record<string, string> = {
  "EU AI Act":
    "EU regulation on AI systems. Classifies AI by risk (prohibited, high-risk, limited, minimal). High-risk systems require conformity assessments.",
  "NIST AI RMF":
    "NIST AI Risk Management Framework. Voluntary framework for trustworthy AI systems.",
  "CoSAI SRF":
    "CoSAI Security Reference Framework. Five-layer model: Business, Information, Application, Platform, Supply Chain.",
  "OWASP AIVSS":
    "OWASP Agentic AI Vulnerability Scoring System. Combines base vulnerability severity with agentic amplification factors into a 0–10 score for autonomous AI.",
  SLSA: "Supply-chain Levels for Software Artifacts. Framework for ensuring supply chain integrity (L0–L4).",
  L0: "Human-only: No AI autonomy. Human makes all decisions.",
  L1: "Assisted: AI suggests; human decides.",
  L2: "Semi-autonomous: AI acts with human oversight.",
  L3: "Autonomous: AI acts; human monitors.",
  L4: "Full autonomy: AI operates independently.",
  L5: "Extended autonomy across systems."
};

type Props = {
  term: string;
  children: React.ReactNode;
};

export function TechnicalTooltip({ term, children }: Props) {
  const text = TERM_DEFINITIONS[term];
  if (!text) return <>{children}</>;
  return (
    <Tooltip content={text}>
      <span className="cursor-help border-b border-dashed border-gray-400">{children}</span>
    </Tooltip>
  );
}
