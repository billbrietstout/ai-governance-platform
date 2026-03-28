/**
 * Vertical compliance profiles – regulations by industry.
 * Maps org verticalMarket to applicable regulations.
 */

export type VerticalKey =
  | "FINANCIAL_SERVICES"
  | "HEALTHCARE"
  | "INSURANCE"
  | "GENERAL"
  | "PUBLIC_SECTOR"
  | "ENERGY"
  | "HR_SERVICES"
  | "AUTOMOTIVE"
  | "TELECOM"
  | "MANUFACTURING"
  | "RETAIL";

export type Regulation = {
  code: string;
  name: string;
  jurisdiction: string;
  mandatory: boolean;
  applies_to: string[];
  description?: string;
  euAiActAnnexIII?: boolean;
  condition?: string;
};

export type VerticalProfile = {
  regulations: Regulation[];
  label: string;
  description: string;
};

export const VERTICAL_REGULATIONS: Record<VerticalKey, VerticalProfile> = {
  FINANCIAL_SERVICES: {
    label: "Financial Services",
    description: "Banking, capital markets, and financial institutions",
    regulations: [
      {
        code: "SR_11_7",
        name: "SR 11-7 Model Risk Management",
        jurisdiction: "US",
        mandatory: true,
        applies_to: ["MODEL", "AGENT"],
        description: "Fed/OCC model risk management for AI/ML systems"
      },
      {
        code: "DORA",
        name: "Digital Operational Resilience Act",
        jurisdiction: "EU",
        mandatory: true,
        applies_to: ["MODEL", "AGENT", "APPLICATION"],
        description: "Operational resilience for AI in financial infrastructure"
      },
      {
        code: "SEC_AI",
        name: "SEC AI Disclosure Rules",
        jurisdiction: "US",
        mandatory: true,
        applies_to: ["MODEL", "AGENT"],
        description: "AI-related risk disclosure for financial institutions"
      },
      {
        code: "EU_AI_ACT_CREDIT",
        name: "EU AI Act - Credit Scoring (Annex III)",
        jurisdiction: "EU",
        mandatory: true,
        applies_to: ["MODEL", "AGENT"],
        euAiActAnnexIII: true
      }
    ]
  },
  HEALTHCARE: {
    label: "Healthcare",
    description: "Medical devices, clinical decision support, and health data",
    regulations: [
      {
        code: "FDA_SAMD",
        name: "FDA AI/ML Software as Medical Device",
        jurisdiction: "US",
        mandatory: true,
        applies_to: ["MODEL", "AGENT", "APPLICATION"]
      },
      {
        code: "HIPAA_AI",
        name: "HIPAA AI data policy",
        jurisdiction: "US",
        mandatory: true,
        applies_to: ["MODEL", "AGENT", "APPLICATION"]
      },
      {
        code: "EU_AI_ACT_MEDICAL",
        name: "EU AI Act - Medical Devices (Annex III)",
        jurisdiction: "EU",
        mandatory: true,
        applies_to: ["MODEL", "AGENT"],
        euAiActAnnexIII: true
      },
      {
        code: "EMA_AI",
        name: "EMA AI in Medicine Guidance",
        jurisdiction: "EU",
        mandatory: false,
        applies_to: ["MODEL"]
      }
    ]
  },
  INSURANCE: {
    label: "Insurance",
    description: "Insurance underwriting, claims, and risk assessment",
    regulations: [
      {
        code: "NAIC_AI",
        name: "NAIC Model Bulletin on AI",
        jurisdiction: "US",
        mandatory: false,
        applies_to: ["MODEL", "AGENT", "APPLICATION"]
      },
      {
        code: "CO_SB21_169",
        name: "Colorado SB21-169 Insurance AI",
        jurisdiction: "US_STATE",
        mandatory: true,
        applies_to: ["MODEL", "AGENT"]
      },
      {
        code: "EU_AI_ACT_INSURANCE",
        name: "EU AI Act - Insurance Risk Assessment",
        jurisdiction: "EU",
        mandatory: true,
        applies_to: ["MODEL", "AGENT"],
        euAiActAnnexIII: true
      }
    ]
  },
  GENERAL: {
    label: "General (Manufacturing/Retail)",
    description: "Manufacturing, retail, and general enterprise",
    regulations: [
      {
        code: "EU_AI_ACT",
        name: "EU AI Act",
        jurisdiction: "EU",
        mandatory: false,
        applies_to: ["MODEL", "AGENT", "APPLICATION", "PIPELINE"],
        description: "Risk-based obligations for AI systems"
      },
      {
        code: "ISO_42001",
        name: "ISO/IEC 42001 AI Management System",
        jurisdiction: "INTERNATIONAL",
        mandatory: false,
        applies_to: ["MODEL", "AGENT"],
        description: "AI management system standard"
      },
      {
        code: "NYC_LL144",
        name: "NYC Local Law 144 - Automated Employment",
        jurisdiction: "US_LOCAL",
        mandatory: true,
        applies_to: ["MODEL", "AGENT"],
        condition: "asset name contains 'recruit' or 'screening' or 'hiring'"
      },
      {
        code: "IL_AEIA",
        name: "Illinois Artificial Intelligence Video Interview Act",
        jurisdiction: "US_STATE",
        mandatory: true,
        applies_to: ["MODEL"],
        condition: "HR assets using video/interview analysis"
      }
    ]
  },
  PUBLIC_SECTOR: {
    label: "Public Sector",
    description: "Government and public administration",
    regulations: [
      {
        code: "EO_14110",
        name: "US Executive Order 14110 on AI Safety",
        jurisdiction: "US",
        mandatory: true,
        applies_to: ["MODEL", "AGENT", "APPLICATION"]
      },
      {
        code: "OMB_AI",
        name: "OMB AI Policy M-24-10",
        jurisdiction: "US",
        mandatory: true,
        applies_to: ["MODEL", "AGENT"]
      },
      {
        code: "EU_AI_ACT_PUBLIC",
        name: "EU AI Act - Public Sector",
        jurisdiction: "EU",
        mandatory: true,
        applies_to: ["MODEL", "AGENT", "APPLICATION"],
        euAiActAnnexIII: true
      }
    ]
  },
  ENERGY: {
    label: "Energy",
    description: "Energy, utilities, and critical infrastructure",
    regulations: [
      {
        code: "NERC_CIP",
        name: "NERC CIP Critical Infrastructure Protection",
        jurisdiction: "US",
        mandatory: true,
        applies_to: ["MODEL", "AGENT", "APPLICATION"]
      },
      {
        code: "EU_AI_ACT_CRITICAL",
        name: "EU AI Act - Critical Infrastructure",
        jurisdiction: "EU",
        mandatory: true,
        applies_to: ["MODEL", "AGENT"],
        euAiActAnnexIII: true
      }
    ]
  },
  HR_SERVICES: {
    label: "HR Services",
    description: "Employment, recruitment, and workforce management",
    regulations: [
      {
        code: "NYC_LL144",
        name: "NYC Local Law 144 - Automated Employment",
        jurisdiction: "US_LOCAL",
        mandatory: true,
        applies_to: ["MODEL", "AGENT"],
        description: "Bias audits for AI in hiring and promotion"
      },
      {
        code: "IL_AEIA",
        name: "Illinois Artificial Intelligence Video Interview Act",
        jurisdiction: "US_STATE",
        mandatory: true,
        applies_to: ["MODEL", "AGENT"],
        condition: "HR assets using video/interview analysis"
      },
      {
        code: "EU_AI_ACT_EMPLOYMENT",
        name: "EU AI Act - Employment (Annex III)",
        jurisdiction: "EU",
        mandatory: true,
        applies_to: ["MODEL", "AGENT"],
        euAiActAnnexIII: true
      }
    ]
  },
  AUTOMOTIVE: {
    label: "Automotive",
    description: "Automated driving, ADAS, and in-vehicle AI systems",
    regulations: [
      {
        code: "EU_AI_ACT_ROAD_TRAFFIC",
        name: "EU AI Act - Road Traffic (Annex III)",
        jurisdiction: "EU",
        mandatory: true,
        applies_to: ["MODEL", "AGENT", "APPLICATION"],
        euAiActAnnexIII: true,
        description: "AI safety components in road traffic management and operation"
      },
      {
        code: "UNECE_WP29",
        name: "UNECE WP.29 Automated Vehicles",
        jurisdiction: "INTERNATIONAL",
        mandatory: true,
        applies_to: ["MODEL", "AGENT", "APPLICATION"],
        description: "Type-approval for automated and autonomous driving systems"
      },
      {
        code: "EU_2019_2144",
        name: "EU Regulation 2019/2144 (Type-Approval)",
        jurisdiction: "EU",
        mandatory: true,
        applies_to: ["MODEL", "AGENT", "APPLICATION"],
        description: "Safety requirements for AI in vehicles; driver assistance systems"
      }
    ]
  },
  TELECOM: {
    label: "Telecommunications",
    description: "Network operators, digital infrastructure, and telecom services",
    regulations: [
      {
        code: "NIS2_AI",
        name: "NIS2 - AI in Critical Digital Infrastructure",
        jurisdiction: "EU",
        mandatory: true,
        applies_to: ["MODEL", "AGENT", "APPLICATION"],
        description: "Cybersecurity and incident reporting for AI in essential services"
      },
      {
        code: "EU_AI_ACT_CRITICAL",
        name: "EU AI Act - Critical Infrastructure (Annex III)",
        jurisdiction: "EU",
        mandatory: true,
        applies_to: ["MODEL", "AGENT"],
        euAiActAnnexIII: true,
        description: "High-risk AI in critical digital infrastructure"
      }
    ]
  },
  MANUFACTURING: {
    label: "Manufacturing",
    description: "Industrial AI, automation, and supply chain",
    regulations: [
      {
        code: "EU_AI_ACT_CRITICAL",
        name: "EU AI Act - Critical Infrastructure (Annex III)",
        jurisdiction: "EU",
        mandatory: true,
        applies_to: ["MODEL", "AGENT", "APPLICATION"],
        euAiActAnnexIII: true,
        description: "AI in industrial critical infrastructure"
      },
      {
        code: "ISO_42001",
        name: "ISO/IEC 42001 AI Management System",
        jurisdiction: "INTERNATIONAL",
        mandatory: false,
        applies_to: ["MODEL", "AGENT"],
        description: "AI management system for industrial deployments"
      }
    ]
  },
  RETAIL: {
    label: "Retail",
    description: "Consumer-facing AI, recommendations, and customer experience",
    regulations: [
      {
        code: "EU_AI_ACT",
        name: "EU AI Act - Consumer AI",
        jurisdiction: "EU",
        mandatory: false,
        applies_to: ["MODEL", "AGENT", "APPLICATION", "PIPELINE"],
        description: "Transparency and risk obligations for consumer-facing AI"
      },
      {
        code: "EU_AI_ACT_TRANSPARENCY",
        name: "EU AI Act - Art. 50 Transparency",
        jurisdiction: "EU",
        mandatory: true,
        applies_to: ["MODEL", "AGENT", "APPLICATION"],
        description: "Disclosure obligations when AI interacts with consumers"
      }
    ]
  }
};

/** Map Prisma VerticalMarket to our VerticalKey */
export function orgVerticalToKey(vertical: string | null): VerticalKey {
  switch (vertical) {
    case "FINANCIAL":
      return "FINANCIAL_SERVICES";
    case "HEALTHCARE":
      return "HEALTHCARE";
    case "PUBLIC_SECTOR":
      return "PUBLIC_SECTOR";
    case "INSURANCE":
      return "INSURANCE";
    case "ENERGY":
      return "ENERGY";
    case "AUTOMOTIVE":
      return "AUTOMOTIVE";
    case "RETAIL":
      return "RETAIL";
    case "MANUFACTURING":
      return "MANUFACTURING";
    case "GENERAL":
    default:
      return "GENERAL";
  }
}

/** All vertical keys for multi-select */
export const ALL_VERTICAL_KEYS: VerticalKey[] = [
  "GENERAL",
  "FINANCIAL_SERVICES",
  "HEALTHCARE",
  "INSURANCE",
  "PUBLIC_SECTOR",
  "ENERGY",
  "HR_SERVICES",
  "AUTOMOTIVE",
  "TELECOM",
  "MANUFACTURING",
  "RETAIL"
];

/** Check if an asset applies to a regulation (including conditions) */
export function assetAppliesToRegulation(
  asset: { name: string; assetType: string; description?: string | null },
  reg: Regulation
): boolean {
  if (!reg.applies_to.includes(asset.assetType)) return false;
  if (!reg.condition) return true;

  const name = (asset.name ?? "").toLowerCase();
  const desc = (asset.description ?? "").toLowerCase();
  const combined = `${name} ${desc}`;

  if (
    reg.condition.includes("recruit") ||
    reg.condition.includes("screening") ||
    reg.condition.includes("hiring")
  ) {
    return (
      combined.includes("recruit") ||
      combined.includes("screening") ||
      combined.includes("hiring") ||
      combined.includes("resume") ||
      combined.includes("cv ")
    );
  }
  if (reg.condition.includes("video") || reg.condition.includes("interview")) {
    return combined.includes("video") || combined.includes("interview");
  }
  return false;
}

/** Get regulations applicable to an asset for a given vertical */
export function getAssetRegulations(
  asset: { name: string; assetType: string; description?: string | null },
  verticalKey: VerticalKey
): Regulation[] {
  const profile = VERTICAL_REGULATIONS[verticalKey];
  if (!profile) return [];
  return profile.regulations.filter((r) => assetAppliesToRegulation(asset, r));
}
