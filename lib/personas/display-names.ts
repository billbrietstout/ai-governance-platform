/**
 * Plain English display names for roles and personas.
 * Used on CEO-facing surfaces — never show raw email or technical codes.
 */

export const PERSONA_DISPLAY: Record<string, string> = {
  CAIO: "AI Officer",
  CISO: "Security Officer",
  DEV_LEAD: "Development Lead",
  DATA_OWNER: "Data Officer",
  PLATFORM_ENG: "Platform Engineer",
  LEGAL: "Legal/Compliance",
  VENDOR_MGR: "Vendor Manager",
  CEO: "Chief Executive",
  CFO: "Chief Financial Officer",
  COO: "Chief Operating Officer"
};

export const ROLE_DISPLAY: Record<string, string> = {
  ADMIN: "Admin",
  CAIO: "AI Officer",
  MEMBER: "Member"
};

export function getUserDisplayName(user: {
  email: string;
  persona?: string | null;
  role?: string | null;
}): string {
  const name = user.email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const title = user.persona?.length
    ? PERSONA_DISPLAY[user.persona] ?? user.persona
    : user.role?.length
      ? ROLE_DISPLAY[user.role] ?? user.role
      : null;
  return title ? `${name} (${title})` : name;
}
