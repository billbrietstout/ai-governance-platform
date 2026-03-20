/**
 * Persona-specific dashboard routing.
 * Maps personas to focused single-page dashboard URLs.
 */
import type { PersonaId } from "./config";

export const PERSONA_DASHBOARD_MAP: Record<PersonaId, string> = {
  CEO: "/dashboard/executive",
  CFO: "/dashboard/executive",
  COO: "/dashboard/executive",
  CAIO: "/dashboard/caio",
  CISO: "/dashboard/ciso",
  DATA_OWNER: "/dashboard/data-steward",
  DEV_LEAD: "/dashboard/developer",
  PLATFORM_ENG: "/dashboard/platform",
  VENDOR_MGR: "/dashboard/supply-chain",
  LEGAL: "/dashboard/compliance-officer"
};

export function getPersonaDashboardPath(persona: string | null): string | null {
  if (!persona || !(persona in PERSONA_DASHBOARD_MAP)) return null;
  return PERSONA_DASHBOARD_MAP[persona as PersonaId] ?? null;
}

export function isPersonaDashboardPath(pathname: string): boolean {
  return Object.values(PERSONA_DASHBOARD_MAP).some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}
