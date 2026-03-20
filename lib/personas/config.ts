/**
 * Persona-aware navigation – config per role/persona.
 */

export type PersonaId =
  | "CEO"
  | "CFO"
  | "COO"
  | "CISO"
  | "LEGAL"
  | "CAIO"
  | "DATA_OWNER"
  | "DEV_LEAD"
  | "PLATFORM_ENG"
  | "VENDOR_MGR";

export type PersonaConfig = {
  id: PersonaId;
  label: string;
  description: string;
  defaultLandingPage: string;
  visibleLayers: string[];
  visibleSections: string[];
  primaryCapabilities: string[];
  maturityGate: number;
};

export const PERSONA_CONFIGS: Record<PersonaId, PersonaConfig> = {
  CEO: {
    id: "CEO",
    label: "CEO",
    description: "Executive overview and strategic governance",
    defaultLandingPage: "/dashboard/executive",
    visibleLayers: ["L1"],
    visibleSections: ["GOVERNANCE OVERVIEW", "LAYER 1: BUSINESS"],
    primaryCapabilities: ["/", "/layer1-business", "/maturity", "/reports"],
    maturityGate: 1
  },
  CFO: {
    id: "CFO",
    label: "CFO",
    description: "Financial views and ROI metrics",
    defaultLandingPage: "/dashboard/executive",
    visibleLayers: ["L1"],
    visibleSections: ["GOVERNANCE OVERVIEW", "LAYER 1: BUSINESS"],
    primaryCapabilities: ["/layer1-business", "/reports", "/"],
    maturityGate: 1
  },
  COO: {
    id: "COO",
    label: "COO",
    description: "Operations and asset oversight",
    defaultLandingPage: "/dashboard/executive",
    visibleLayers: ["L1", "L3"],
    visibleSections: ["GOVERNANCE OVERVIEW", "LAYER 1: BUSINESS", "LAYER 3: APPLICATION"],
    primaryCapabilities: ["/layer1-business", "/layer3-application/assets", "/"],
    maturityGate: 1
  },
  CISO: {
    id: "CISO",
    label: "CISO",
    description: "Security, platform, and supply chain oversight",
    defaultLandingPage: "/layer4-platform",
    visibleLayers: ["L1", "L3", "L4", "L5"],
    visibleSections: [
      "GOVERNANCE OVERVIEW",
      "LAYER 1: BUSINESS",
      "LAYER 3: APPLICATION",
      "LAYER 4: PLATFORM",
      "LAYER 5: SUPPLY CHAIN"
    ],
    primaryCapabilities: [
      "/layer4-platform",
      "/layer4-platform/telemetry",
      "/layer5-supply-chain/scanning",
      "/layer3-application/gaps",
      "/audit"
    ],
    maturityGate: 1
  },
  LEGAL: {
    id: "LEGAL",
    label: "Legal / CLO",
    description: "Compliance, regulatory, and contract views",
    defaultLandingPage: "/dashboard/compliance-officer",
    visibleLayers: ["L1", "L2", "L5"],
    visibleSections: [
      "GOVERNANCE OVERVIEW",
      "LAYER 1: BUSINESS",
      "LAYER 2: INFORMATION",
      "LAYER 5: SUPPLY CHAIN"
    ],
    primaryCapabilities: [
      "/layer1-business",
      "/layer1-business/regulatory-cascade",
      "/layer5-supply-chain/vendors",
      "/assessments",
      "/reports"
    ],
    maturityGate: 1
  },
  CAIO: {
    id: "CAIO",
    label: "CAIO",
    description: "Full AI governance access across all layers",
    defaultLandingPage: "/dashboard/caio",
    visibleLayers: ["L1", "L2", "L3", "L4", "L5"],
    visibleSections: [
      "GOVERNANCE OVERVIEW",
      "LAYER 1: BUSINESS",
      "LAYER 2: INFORMATION",
      "LAYER 3: APPLICATION",
      "LAYER 4: PLATFORM",
      "LAYER 5: SUPPLY CHAIN",
      "SETTINGS"
    ],
    primaryCapabilities: [
      "/",
      "/maturity",
      "/layer3-application/assets",
      "/layer1-business/regulatory-cascade",
      "/reports"
    ],
    maturityGate: 1
  },
  DATA_OWNER: {
    id: "DATA_OWNER",
    label: "Data Owner",
    description: "Data catalog, lineage, and information governance",
    defaultLandingPage: "/layer2-information",
    visibleLayers: ["L2"],
    visibleSections: ["GOVERNANCE OVERVIEW", "LAYER 2: INFORMATION"],
    primaryCapabilities: [
      "/layer2-information",
      "/layer2-information/data-catalog",
      "/layer2-information/prompts"
    ],
    maturityGate: 1
  },
  DEV_LEAD: {
    id: "DEV_LEAD",
    label: "Development Lead",
    description: "AI assets, accountability, and application layer",
    defaultLandingPage: "/dashboard/developer",
    visibleLayers: ["L3", "L4"],
    visibleSections: ["GOVERNANCE OVERVIEW", "LAYER 3: APPLICATION", "LAYER 4: PLATFORM"],
    primaryCapabilities: [
      "/layer3-application/assets",
      "/layer3-application/accountability",
      "/layer3-application/gaps",
      "/layer4-platform/telemetry",
      "/assessments"
    ],
    maturityGate: 1
  },
  PLATFORM_ENG: {
    id: "PLATFORM_ENG",
    label: "Platform Engineer",
    description: "Platform ops, telemetry, and supply chain",
    defaultLandingPage: "/dashboard/platform",
    visibleLayers: ["L4", "L5"],
    visibleSections: ["GOVERNANCE OVERVIEW", "LAYER 4: PLATFORM", "LAYER 5: SUPPLY CHAIN"],
    primaryCapabilities: [
      "/layer4-platform",
      "/layer4-platform/telemetry",
      "/layer5-supply-chain",
      "/layer5-supply-chain/scanning",
      "/layer5-supply-chain/cards"
    ],
    maturityGate: 1
  },
  VENDOR_MGR: {
    id: "VENDOR_MGR",
    label: "Vendor Manager",
    description: "Supply chain, vendors, and L1 compliance",
    defaultLandingPage: "/dashboard/supply-chain",
    visibleLayers: ["L5", "L1"],
    visibleSections: ["GOVERNANCE OVERVIEW", "LAYER 1: BUSINESS", "LAYER 5: SUPPLY CHAIN"],
    primaryCapabilities: [
      "/layer5-supply-chain",
      "/layer5-supply-chain/vendors",
      "/layer1-business/regulatory-cascade",
      "/reports"
    ],
    maturityGate: 1
  }
};

export const PERSONA_IDS: PersonaId[] = [
  "CEO",
  "CFO",
  "COO",
  "CISO",
  "LEGAL",
  "CAIO",
  "DATA_OWNER",
  "DEV_LEAD",
  "PLATFORM_ENG",
  "VENDOR_MGR"
];

export function getPersonaConfig(personaId: string | null): PersonaConfig | null {
  if (!personaId || !(personaId in PERSONA_CONFIGS)) return null;
  return PERSONA_CONFIGS[personaId as PersonaId] ?? null;
}

export function getDefaultLandingForPersona(personaId: string | null): string {
  const config = getPersonaConfig(personaId);
  return config?.defaultLandingPage ?? "/";
}
