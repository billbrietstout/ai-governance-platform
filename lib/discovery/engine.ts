/**
 * Regulation Discovery Engine – determines applicable regulations
 * based on AI system characteristics before building.
 * Pure computation — safe for client-side use (no prisma/server imports).
 */

import type { VerticalKey } from "@/lib/vertical-regulations";
import { VERTICAL_REGULATIONS, assetAppliesToRegulation } from "@/lib/vertical-regulations";

export type EuAIActEntityType =
  | "PROVIDER"
  | "DEPLOYER"
  | "DISTRIBUTOR"
  | "IMPORTER"
  | "PRODUCT_MANUFACTURER"
  | "AUTHORISED_REPRESENTATIVE";

export type DiscoveryInputs = {
  assetType: "MODEL" | "AGENT" | "APPLICATION" | "PIPELINE";
  description?: string;
  businessFunction:
    | "HR"
    | "Finance"
    | "Operations"
    | "Customer Service"
    | "Healthcare"
    | "Legal"
    | "Other";
  decisionsAffectingPeople: boolean;
  interactsWithEndUsers: boolean;
  deployment: "EU_market" | "US_only" | "Global" | "Internal_only";
  verticals: string[];
  operatingModel?: string;
  autonomyLevel: "L0" | "L1" | "L2" | "L3" | "L4" | "L5";
  dataTypes: string[];
  euResidentsData: "Yes" | "No" | "Unknown";
  expectedRiskLevel: "Low" | "Medium" | "High" | "Critical";
  vulnerablePopulations: boolean;
  /** Scope #S1: Organisation established or located in EU */
  euEstablishedInEU?: boolean;
  /** Exclusions #R2: military, R&D, open source, personal use */
  euExclusion?: "none" | "military" | "rd_only" | "open_source" | "personal_use";
  /** Transparency #R4: deep-fake, synthetic content, emotion/biometric, natural-person interaction */
  euTransparencyTypes?: (
    | "deep_fake"
    | "synthetic_content"
    | "emotion_biometric"
    | "natural_person"
  )[];
  /** Entity type #E1 */
  euEntityType?: EuAIActEntityType;
};

export type RegulationApplicability = "MANDATORY" | "LIKELY_APPLICABLE" | "RECOMMENDED";

export type DiscoveredRegulation = {
  code: string;
  name: string;
  jurisdiction: string;
  applicability: RegulationApplicability;
  keyRequirements: string;
  deadline?: string;
  implementationEffort: "Low" | "Medium" | "High";
};

export type RequiredControl = {
  controlId: string;
  title: string;
  cosaiLayer:
    | "LAYER_1_BUSINESS"
    | "LAYER_2_INFORMATION"
    | "LAYER_3_APPLICATION"
    | "LAYER_4_PLATFORM"
    | "LAYER_5_SUPPLY_CHAIN";
  complianceStatus?: "compliant" | "non_compliant" | "pending" | "not_applicable";
};

export type RegulationDiscoveryResult = {
  mandatory: DiscoveredRegulation[];
  likelyApplicable: DiscoveredRegulation[];
  recommended: DiscoveredRegulation[];
  requiredControls: RequiredControl[];
  estimatedMaturityRequired: number;
  riskScore: number;
};

/** Annex III high-risk use cases (flowchart #HR4) – expanded per FLI checker */
const EU_AI_ACT_ANNEX_III_USE_CASES: Record<string, string[]> = {
  HR: [
    "recruitment",
    "screening",
    "hiring",
    "employment",
    "workforce",
    "personnel",
    "biometric",
    "biometrics"
  ],
  Finance: ["credit", "scoring", "lending", "insurance", "underwriting", "claims"],
  Healthcare: ["medical", "clinical", "diagnosis", "treatment", "health"],
  Operations: [
    "critical infrastructure",
    "safety",
    "transport",
    "energy",
    "border",
    "migration",
    "asylum",
    "law enforcement",
    "policing"
  ],
  Customer_Service: ["chatbot", "support"],
  Legal: ["legal", "judicial", "justice", "democratic", "essential service", "public service"],
  Other: ["education", "vocational", "training", "school", "student"]
};

const COSAI_LAYERS = [
  "LAYER_1_BUSINESS",
  "LAYER_2_INFORMATION",
  "LAYER_3_APPLICATION",
  "LAYER_4_PLATFORM",
  "LAYER_5_SUPPLY_CHAIN"
] as const;

function mapVerticalToKey(v: string): VerticalKey {
  const map: Record<string, VerticalKey> = {
    GENERAL: "GENERAL",
    FINANCIAL: "FINANCIAL_SERVICES",
    FINANCIAL_SERVICES: "FINANCIAL_SERVICES",
    HEALTHCARE: "HEALTHCARE",
    INSURANCE: "INSURANCE",
    PUBLIC_SECTOR: "PUBLIC_SECTOR",
    ENERGY: "ENERGY",
    HR: "HR_SERVICES",
    HR_SERVICES: "HR_SERVICES"
  };
  return (map[v] ?? "GENERAL") as VerticalKey;
}

function isAnnexIIIHighRisk(inputs: DiscoveryInputs): boolean {
  const desc = (inputs.description ?? "").toLowerCase();
  const bf = inputs.businessFunction;
  // Check business-function-specific triggers
  const triggers = EU_AI_ACT_ANNEX_III_USE_CASES[bf] ?? [];
  if (triggers.some((t) => desc.includes(t))) return true;
  // Cross-function: description keywords for all Annex III domains
  const annexIIIKeywords = [
    "biometric",
    "recruitment",
    "credit",
    "education",
    "critical infrastructure",
    "law enforcement",
    "border",
    "migration",
    "justice",
    "essential service"
  ];
  if (annexIIIKeywords.some((kw) => desc.includes(kw))) return true;
  if (inputs.decisionsAffectingPeople && (bf === "HR" || bf === "Finance" || bf === "Healthcare"))
    return true;
  return false;
}

function deriveControlsFromRegulations(regs: DiscoveredRegulation[]): RequiredControl[] {
  const controls: RequiredControl[] = [];
  const seen = new Set<string>();

  for (const r of regs) {
    if (r.applicability === "MANDATORY" || r.applicability === "LIKELY_APPLICABLE") {
      const layer = r.code.startsWith("EU_AI_ACT") ? "LAYER_1_BUSINESS" : "LAYER_3_APPLICATION";
      const id = `${r.code}_RM`;
      if (!seen.has(id)) {
        seen.add(id);
        controls.push({
          controlId: id,
          title: `Risk management for ${r.name}`,
          cosaiLayer: layer
        });
      }
      if (r.code.includes("GDPR") || r.code.includes("PII")) {
        const dgId = `${r.code}_DG`;
        if (!seen.has(dgId)) {
          seen.add(dgId);
          controls.push({
            controlId: dgId,
            title: "Data governance and quality",
            cosaiLayer: "LAYER_2_INFORMATION"
          });
        }
      }
    }
  }

  return controls;
}

export function runDiscovery(inputs: DiscoveryInputs): RegulationDiscoveryResult {
  const mandatory: DiscoveredRegulation[] = [];
  const likelyApplicable: DiscoveredRegulation[] = [];
  const recommended: DiscoveredRegulation[] = [];
  const asset = {
    name: inputs.description ?? "Planned system",
    assetType: inputs.assetType,
    description: inputs.description
  };

  const usMarket = inputs.deployment === "US_only" || inputs.deployment === "Global";
  const annexIII = isAnnexIIIHighRisk(inputs);
  const autonomyL3Plus = ["L3", "L4", "L5"].includes(inputs.autonomyLevel);
  const gdprRelevant =
    inputs.euResidentsData === "Yes" && inputs.dataTypes.some((d) => d === "PII");
  const hrRelevant = inputs.businessFunction === "HR" || inputs.dataTypes.includes("Employment");
  const decisionsAboutPeople = inputs.decisionsAffectingPeople;

  // EU AI Act – scope #S1: placing on market, established in EU, output used in EU
  // Exclusions #R2: military, R&D only, open source, personal use → skip if applicable
  const euExcluded =
    inputs.euExclusion === "military" ||
    inputs.euExclusion === "rd_only" ||
    inputs.euExclusion === "open_source" ||
    inputs.euExclusion === "personal_use";

  const euJurisdiction =
    !euExcluded &&
    (inputs.deployment === "EU_market" ||
      inputs.euResidentsData === "Yes" ||
      inputs.euEstablishedInEU === true);
  const euPossible =
    !euExcluded &&
    (inputs.euResidentsData === "Unknown" ||
      inputs.deployment === "Global" ||
      (inputs.euEstablishedInEU === undefined && inputs.deployment !== "US_only"));

  if (!euExcluded) {
    if (euJurisdiction) {
      // EU jurisdiction applies – add as MANDATORY
      if (annexIII) {
        mandatory.push({
          code: "EU_AI_ACT_ANNEX_III",
          name: "EU AI Act – High-Risk (Annex III)",
          jurisdiction: "EU",
          applicability: "MANDATORY",
          keyRequirements:
            "Conformity assessment, risk management, data governance, human oversight, transparency",
          deadline: "Aug 2026 (high-risk systems)",
          implementationEffort: "High"
        });
      } else if (inputs.interactsWithEndUsers || (inputs.euTransparencyTypes?.length ?? 0) > 0) {
        const transparencyTypes = inputs.euTransparencyTypes ?? [];
        const transparencyList = transparencyTypes.length
          ? transparencyTypes.join(", ").replace(/_/g, " ")
          : "direct user interaction";
        mandatory.push({
          code: "EU_AI_ACT_LIMITED",
          name: "EU AI Act – Limited Risk (Transparency)",
          jurisdiction: "EU",
          applicability: "MANDATORY",
          keyRequirements: `Transparency obligations (Art. 50): ${transparencyList}`,
          deadline: "Feb 2026",
          implementationEffort: "Medium"
        });
      } else {
        recommended.push({
          code: "EU_AI_ACT_MINIMAL",
          name: "EU AI Act – Minimal Risk",
          jurisdiction: "EU",
          applicability: "RECOMMENDED",
          keyRequirements: "Voluntary codes of conduct; consider transparency for future changes",
          implementationEffort: "Low"
        });
      }
    } else if (euPossible) {
      // EU might apply – add as LIKELY (not mandatory)
      if (annexIII) {
        likelyApplicable.push({
          code: "EU_AI_ACT_ANNEX_III",
          name: "EU AI Act – High-Risk (Annex III)",
          jurisdiction: "EU",
          applicability: "LIKELY_APPLICABLE",
          keyRequirements:
            "Conformity assessment, risk management, data governance, human oversight, transparency",
          deadline: "Aug 2026 (high-risk systems)",
          implementationEffort: "High"
        });
      } else if (inputs.interactsWithEndUsers || (inputs.euTransparencyTypes?.length ?? 0) > 0) {
        likelyApplicable.push({
          code: "EU_AI_ACT_LIMITED",
          name: "EU AI Act – Limited Risk (Transparency)",
          jurisdiction: "EU",
          applicability: "LIKELY_APPLICABLE",
          keyRequirements: "Transparency obligations (Art. 50–52) for AI interacting with humans",
          deadline: "Feb 2026",
          implementationEffort: "Medium"
        });
      } else {
        likelyApplicable.push({
          code: "EU_AI_ACT_MINIMAL",
          name: "EU AI Act – Minimal Risk",
          jurisdiction: "EU",
          applicability: "LIKELY_APPLICABLE",
          keyRequirements: "Voluntary codes of conduct; consider transparency for future changes",
          implementationEffort: "Low"
        });
      }
    }
  }

  // GDPR AI implications
  if (gdprRelevant) {
    mandatory.push({
      code: "GDPR_AI",
      name: "GDPR – AI Data Processing",
      jurisdiction: "EU",
      applicability: "MANDATORY",
      keyRequirements:
        "Lawful basis, data minimization, purpose limitation, rights to explanation, DPIAs for automated decision-making",
      implementationEffort: "High"
    });
  }

  // NYC LL144 / EEOC – employment decisions
  if (hrRelevant && (usMarket || inputs.deployment === "Global") && decisionsAboutPeople) {
    mandatory.push({
      code: "NYC_LL144",
      name: "NYC Local Law 144 – Automated Employment",
      jurisdiction: "US_LOCAL",
      applicability: "MANDATORY",
      keyRequirements: "Bias audit, transparency to candidates, human review",
      implementationEffort: "Medium"
    });
    likelyApplicable.push({
      code: "EEOC_AI",
      name: "EEOC AI and Employment Guidance",
      jurisdiction: "US",
      applicability: "LIKELY_APPLICABLE",
      keyRequirements: "Assess disparate impact, document fairness testing",
      implementationEffort: "Medium"
    });
  }

  // Autonomy L3+ → agentic governance
  if (autonomyL3Plus) {
    likelyApplicable.push({
      code: "AGENTIC_GOVERNANCE",
      name: "Agentic AI Governance",
      jurisdiction: "INTERNATIONAL",
      applicability: "LIKELY_APPLICABLE",
      keyRequirements: "Human-in-the-loop, audit trails, kill switches, scope boundaries",
      implementationEffort: "High"
    });
  }

  // Vulnerable populations
  if (inputs.vulnerablePopulations) {
    likelyApplicable.push({
      code: "VULNERABLE_POP",
      name: "Enhanced Protections for Vulnerable Populations",
      jurisdiction: "INTERNATIONAL",
      applicability: "LIKELY_APPLICABLE",
      keyRequirements:
        "Additional safeguards, consent, monitoring for children, elderly, or at-risk groups",
      implementationEffort: "Medium"
    });
  }

  // Sector-specific from verticals
  const verticalKeys = inputs.verticals
    .map(mapVerticalToKey)
    .filter((k) => VERTICAL_REGULATIONS[k]);
  const seenCodes = new Set(mandatory.map((r) => r.code));
  for (const vk of verticalKeys) {
    const profile = VERTICAL_REGULATIONS[vk];
    for (const reg of profile.regulations) {
      if (seenCodes.has(reg.code)) continue;
      // Skip EU regulations if no EU jurisdiction
      if (reg.jurisdiction === "EU" && !euJurisdiction && !euPossible) continue;
      if (!assetAppliesToRegulation(asset, reg)) continue;
      const entry: DiscoveredRegulation = {
        code: reg.code,
        name: reg.name,
        jurisdiction: reg.jurisdiction,
        applicability: reg.mandatory ? "MANDATORY" : "LIKELY_APPLICABLE",
        keyRequirements: reg.description ?? "Sector-specific requirements",
        implementationEffort: reg.mandatory ? "High" : "Medium"
      };
      if (reg.mandatory) {
        mandatory.push(entry);
      } else {
        likelyApplicable.push(entry);
      }
      seenCodes.add(reg.code);
    }
  }

  // Recommended best practices
  recommended.push({
    code: "NIST_AI_RMF",
    name: "NIST AI Risk Management Framework",
    jurisdiction: "US",
    applicability: "RECOMMENDED",
    keyRequirements: "Govern, map, manage, measure AI risks",
    implementationEffort: "Medium"
  });
  recommended.push({
    code: "ISO_42001",
    name: "ISO/IEC 42001 AI Management System",
    jurisdiction: "INTERNATIONAL",
    applicability: "RECOMMENDED",
    keyRequirements: "AI management system, context, leadership, support",
    implementationEffort: "High"
  });

  const requiredControls = deriveControlsFromRegulations([...mandatory, ...likelyApplicable]);

  // Risk score 0–100
  let riskScore = 20;
  if (annexIII) riskScore += 35;
  if (gdprRelevant) riskScore += 20;
  if (inputs.expectedRiskLevel === "High" || inputs.expectedRiskLevel === "Critical")
    riskScore += 15;
  if (inputs.vulnerablePopulations) riskScore += 10;
  riskScore = Math.min(100, riskScore);

  // Maturity 1–5
  let maturity = 1;
  if (mandatory.length > 0) maturity = 3;
  if (mandatory.length >= 2 || annexIII) maturity = 4;
  if (annexIII && gdprRelevant) maturity = 5;

  return {
    mandatory,
    likelyApplicable,
    recommended,
    requiredControls,
    estimatedMaturityRequired: maturity,
    riskScore
  };
}
