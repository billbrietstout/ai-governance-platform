/**
 * NIST SP 800-53 Rev 5 control families — semantic backbone for mapping
 * EU AI Act, NIST AI RMF, OWASP, and other frameworks to federal-style assurance.
 *
 * @see https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final
 */

import type { Nist80053Family } from "@prisma/client";

export type Nist80053FamilyMeta = {
  code: Nist80053Family;
  name: string;
  summary: string;
};

/** All 20 NIST SP 800-53 Rev 5 families (order matches NIST catalog grouping) */
export const NIST_SP80053_FAMILIES: Nist80053FamilyMeta[] = [
  { code: "AC", name: "Access Control", summary: "Limit system access to authorized users and processes." },
  { code: "AU", name: "Audit and Accountability", summary: "Monitor and record system activity for review." },
  { code: "AT", name: "Awareness and Training", summary: "Security awareness and role-based training." },
  {
    code: "CA",
    name: "Assessment, Authorization, and Monitoring",
    summary: "Security assessments and ongoing authorization."
  },
  {
    code: "CM",
    name: "Configuration Management",
    summary: "Baseline configuration, inventory, and change control."
  },
  {
    code: "CP",
    name: "Contingency Planning",
    summary: "Backup, recovery, and continuity for disruptions."
  },
  {
    code: "IA",
    name: "Identification and Authentication",
    summary: "Identity proofing, credentials, and authenticators."
  },
  { code: "IR", name: "Incident Response", summary: "Detect, respond to, and recover from incidents." },
  { code: "MA", name: "Maintenance", summary: "Controlled maintenance of system components." },
  { code: "MP", name: "Media Protection", summary: "Protect digital and physical media." },
  {
    code: "PE",
    name: "Physical and Environmental Protection",
    summary: "Physical access and environmental controls."
  },
  { code: "PL", name: "Planning", summary: "Security planning, rules of behavior, and policy." },
  { code: "PM", name: "Program Management", summary: "Organization-wide security program requirements." },
  { code: "PS", name: "Personnel Security", summary: "Personnel screening, transfer, and termination." },
  {
    code: "PT",
    name: "PII Processing and Transparency",
    summary: "Processing limits and transparency for personally identifiable information."
  },
  { code: "RA", name: "Risk Assessment", summary: "Identify and assess risk to operations and assets." },
  {
    code: "SA",
    name: "System and Services Acquisition",
    summary: "Security in acquisition and developer configuration management."
  },
  {
    code: "SC",
    name: "System and Communications Protection",
    summary: "Boundary defense, encryption, and separation of functions."
  },
  {
    code: "SI",
    name: "System and Information Integrity",
    summary: "Flaw remediation, malware protection, and information integrity."
  },
  {
    code: "SR",
    name: "Supply Chain Risk Management",
    summary: "Supply chain visibility, provenance, and acquisition of trusted components."
  }
];

const FAMILY_NAME_BY_CODE = new Map(
  NIST_SP80053_FAMILIES.map((f) => [f.code, f.name] as const)
);

export function getNist80053FamilyName(code: Nist80053Family | null | undefined): string | null {
  if (code == null) return null;
  return FAMILY_NAME_BY_CODE.get(code) ?? null;
}
