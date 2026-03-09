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
  | "ENERGY";

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
        description: "Fed/OCC model risk management guidance"
      },
      {
        code: "DORA",
        name: "Digital Operational Resilience Act",
        jurisdiction: "EU",
        mandatory: true,
        applies_to: ["MODEL", "AGENT", "APPLICATION"]
      },
      {
        code: "SEC_AI",
        name: "SEC AI Disclosure Rules",
        jurisdiction: "US",
        mandatory: true,
        applies_to: ["MODEL"]
      },
      {
        code: "EU_AI_ACT_CREDIT",
        name: "EU AI Act - Credit Scoring (Annex III)",
        jurisdiction: "EU",
        mandatory: true,
        applies_to: ["MODEL"],
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
        applies_to: ["MODEL", "APPLICATION"]
      },
      {
        code: "HIPAA_AI",
        name: "HIPAA AI Data Governance",
        jurisdiction: "US",
        mandatory: true,
        applies_to: ["MODEL", "AGENT", "APPLICATION"]
      },
      {
        code: "EU_AI_ACT_MEDICAL",
        name: "EU AI Act - Medical Devices (Annex III)",
        jurisdiction: "EU",
        mandatory: true,
        applies_to: ["MODEL"],
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
        applies_to: ["MODEL", "APPLICATION"]
      },
      {
        code: "CO_SB21_169",
        name: "Colorado SB21-169 Insurance AI",
        jurisdiction: "US_STATE",
        mandatory: true,
        applies_to: ["MODEL"]
      },
      {
        code: "EU_AI_ACT_INSURANCE",
        name: "EU AI Act - Insurance Risk Assessment",
        jurisdiction: "EU",
        mandatory: true,
        applies_to: ["MODEL"],
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
        mandatory: true,
        applies_to: ["MODEL", "AGENT", "APPLICATION", "PIPELINE"]
      },
      {
        code: "ISO_42001",
        name: "ISO/IEC 42001 AI Management System",
        jurisdiction: "INTERNATIONAL",
        mandatory: false,
        applies_to: ["MODEL", "AGENT"]
      },
      {
        code: "NYC_LL144",
        name: "NYC Local Law 144 - Automated Employment",
        jurisdiction: "US_LOCAL",
        mandatory: true,
        applies_to: ["MODEL"],
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
  }
};

/** Map Prisma VerticalMarket to our VerticalKey */
export function orgVerticalToKey(
  vertical: string | null
): VerticalKey {
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
    case "GENERAL":
    case "RETAIL":
    case "MANUFACTURING":
    case "AUTOMOTIVE":
    default:
      return "GENERAL";
  }
}

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

  if (reg.condition.includes("recruit") || reg.condition.includes("screening") || reg.condition.includes("hiring")) {
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
