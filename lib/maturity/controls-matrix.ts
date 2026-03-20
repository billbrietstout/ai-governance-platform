/**
 * Controls matrix – maps maturity layers to platform pages and control descriptions.
 */

import type { MaturityLayer } from "./questions";

export type ControlItem = {
  id: string;
  title: string;
  href: string;
  description?: string;
};

const LAYER_PAGES: Record<MaturityLayer, ControlItem[]> = {
  L1: [
    {
      id: "L1-1",
      title: "AI Governance Policy",
      href: "/layer1-business",
      description: "Document governance principles and scope"
    },
    {
      id: "L1-2",
      title: "Regulatory Mapping",
      href: "/layer1-business/regulatory-cascade",
      description: "Map regulations to AI systems"
    },
    {
      id: "L1-3",
      title: "Executive Ownership",
      href: "/layer1-business",
      description: "CAIO or equivalent accountability"
    },
    {
      id: "L1-4",
      title: "Incident Response Plan",
      href: "/reports",
      description: "AI failure and bias escalation"
    },
    {
      id: "L1-5",
      title: "Value & ROI Tracking",
      href: "/reports/executive-summary",
      description: "Business outcomes and KPIs"
    }
  ],
  L2: [
    {
      id: "L2-1",
      title: "Data Classification",
      href: "/layer2-information/data-catalog",
      description: "PII, confidential, internal"
    },
    {
      id: "L2-2",
      title: "Data Lineage",
      href: "/layer2-information/data-catalog",
      description: "Trace source to model input"
    },
    {
      id: "L2-3",
      title: "MDM for AI",
      href: "/layer2-information/data-catalog",
      description: "Master data management"
    },
    {
      id: "L2-4",
      title: "Shadow AI Discovery",
      href: "/layer2-information/shadow-ai",
      description: "Ungoverned AI detection"
    },
    {
      id: "L2-5",
      title: "Data Stewards",
      href: "/layer2-information/data-catalog",
      description: "Accountability for data quality"
    }
  ],
  L3: [
    {
      id: "L3-1",
      title: "AI Asset Inventory",
      href: "/layer3-application/assets",
      description: "Models, agents, applications"
    },
    {
      id: "L3-2",
      title: "Accountability Matrix",
      href: "/layer3-application/accountability",
      description: "Accountable and responsible parties"
    },
    {
      id: "L3-3",
      title: "Gap Analysis",
      href: "/layer3-application/gaps",
      description: "Compliance framework coverage"
    },
    {
      id: "L3-4",
      title: "Asset Lifecycle",
      href: "/layer3-application/assets",
      description: "Design to retire process"
    },
    {
      id: "L3-5",
      title: "Agentic Controls",
      href: "/layer3-application/assets",
      description: "Human oversight and guardrails"
    }
  ],
  L4: [
    {
      id: "L4-1",
      title: "Scan Coverage",
      href: "/layer5-supply-chain/scanning",
      description: "SBOM, secrets, policy checks"
    },
    {
      id: "L4-2",
      title: "Drift Detection",
      href: "/layer4-platform/drift",
      description: "Model and data drift"
    },
    {
      id: "L4-3",
      title: "Alert Engine",
      href: "/layer4-platform/alerts",
      description: "Anomaly and failure alerts"
    },
    {
      id: "L4-4",
      title: "MLOps Governance",
      href: "/layer5-supply-chain",
      description: "Model registry and approval"
    },
    {
      id: "L4-5",
      title: "Guardrails",
      href: "/layer4-platform/telemetry",
      description: "Safety and PII filters"
    }
  ],
  L5: [
    {
      id: "L5-1",
      title: "Vendor Assurance",
      href: "/layer5-supply-chain/vendors",
      description: "SOC2, ISO, contracts"
    },
    {
      id: "L5-2",
      title: "Model Cards",
      href: "/layer5-supply-chain/cards",
      description: "Intended use and limitations"
    },
    {
      id: "L5-3",
      title: "Provenance Tracking",
      href: "/layer5-supply-chain/cards",
      description: "Training data and version"
    },
    {
      id: "L5-4",
      title: "Vulnerability Management",
      href: "/layer5-supply-chain/scanning",
      description: "SBOM and CVE tracking"
    },
    {
      id: "L5-5",
      title: "Supply Chain Risk",
      href: "/layer5-supply-chain/vendors",
      description: "Vendor and license risk"
    }
  ]
};

export function getControlsForLevel(layer: MaturityLayer, level: number): ControlItem[] {
  const all = LAYER_PAGES[layer];
  return all.slice(0, level);
}

export function getControlsForNextLevel(layer: MaturityLayer, level: number): ControlItem | null {
  const all = LAYER_PAGES[layer];
  if (level >= all.length) return null;
  return all[level] ?? null;
}
