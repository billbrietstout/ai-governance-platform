/**
 * Persona-aware sidebar display modes and allowed sections.
 * Maps personas to sidebar width and navigation filtering.
 */
import type { PersonaId } from "./config";

export type SidebarMode = "full" | "focused" | "hidden";

/** Section keys matching ALL_SECTIONS titles in Sidebar.tsx */
export type SidebarSectionKey =
  | "GOVERNANCE OVERVIEW"
  | "COMPLIANCE"
  | "PLANNING TOOLS"
  | "LAYER 1: BUSINESS"
  | "LAYER 2: INFORMATION"
  | "LAYER 3: APPLICATION"
  | "LAYER 4: PLATFORM"
  | "LAYER 5: SUPPLY CHAIN"
  | "SETTINGS";

export type PersonaSidebarConfig = {
  mode: SidebarMode;
  allowedSections: SidebarSectionKey[] | "all";
};

export const PERSONA_SIDEBAR_CONFIG: Record<PersonaId, PersonaSidebarConfig> = {
  CEO: {
    mode: "hidden",
    allowedSections: ["GOVERNANCE OVERVIEW"]
  },
  CFO: {
    mode: "hidden",
    allowedSections: ["GOVERNANCE OVERVIEW"]
  },
  COO: {
    mode: "focused",
    allowedSections: ["GOVERNANCE OVERVIEW", "COMPLIANCE"]
  },
  CAIO: {
    mode: "full",
    allowedSections: "all"
  },
  CISO: {
    mode: "focused",
    allowedSections: [
      "GOVERNANCE OVERVIEW",
      "COMPLIANCE",
      "LAYER 4: PLATFORM",
      "LAYER 5: SUPPLY CHAIN"
    ]
  },
  LEGAL: {
    mode: "focused",
    allowedSections: [
      "GOVERNANCE OVERVIEW",
      "COMPLIANCE",
      "PLANNING TOOLS"
    ]
  },
  DATA_OWNER: {
    mode: "focused",
    allowedSections: ["GOVERNANCE OVERVIEW", "LAYER 2: INFORMATION"]
  },
  DEV_LEAD: {
    mode: "focused",
    allowedSections: [
      "GOVERNANCE OVERVIEW",
      "LAYER 3: APPLICATION",
      "LAYER 2: INFORMATION"
    ]
  },
  PLATFORM_ENG: {
    mode: "focused",
    allowedSections: [
      "GOVERNANCE OVERVIEW",
      "LAYER 4: PLATFORM",
      "LAYER 5: SUPPLY CHAIN"
    ]
  },
  VENDOR_MGR: {
    mode: "focused",
    allowedSections: ["GOVERNANCE OVERVIEW", "LAYER 5: SUPPLY CHAIN"]
  }
};

export function getPersonaSidebarConfig(persona: string | null): PersonaSidebarConfig | null {
  if (!persona || !(persona in PERSONA_SIDEBAR_CONFIG)) return null;
  return PERSONA_SIDEBAR_CONFIG[persona as PersonaId] ?? null;
}
