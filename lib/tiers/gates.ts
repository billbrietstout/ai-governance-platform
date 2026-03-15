/**
 * Tier gates – what each tier can access.
 */

export type Tier = "FREE" | "PRO" | "ENTERPRISE" | "CONSULTANT";

export type GatedFeature =
  | "audit_packages"
  | "evidence_workbook"
  | "compliance_snapshots"
  | "supply_chain_risk"
  | "advanced_visualizations"
  | "api_access"
  | "multiple_workspaces"
  | "white_label"
  | "client_reports"
  | "bulk_assessment"
  | "sso_saml"
  | "custom_frameworks"
  | "dedicated_support"
  | "sla_guarantees";

const TIER_FEATURES: Record<Tier, GatedFeature[]> = {
  FREE: [],
  PRO: [
    "audit_packages",
    "evidence_workbook",
    "compliance_snapshots",
    "supply_chain_risk",
    "advanced_visualizations",
    "api_access"
  ],
  CONSULTANT: [
    "audit_packages",
    "evidence_workbook",
    "compliance_snapshots",
    "supply_chain_risk",
    "advanced_visualizations",
    "api_access",
    "multiple_workspaces",
    "white_label",
    "client_reports",
    "bulk_assessment"
  ],
  ENTERPRISE: [
    "audit_packages",
    "evidence_workbook",
    "compliance_snapshots",
    "supply_chain_risk",
    "advanced_visualizations",
    "api_access",
    "multiple_workspaces",
    "white_label",
    "client_reports",
    "bulk_assessment",
    "sso_saml",
    "custom_frameworks",
    "dedicated_support",
    "sla_guarantees"
  ]
};

const FEATURE_LABELS: Record<GatedFeature, string> = {
  audit_packages: "Audit packages",
  evidence_workbook: "Evidence workbook",
  compliance_snapshots: "Compliance snapshots",
  supply_chain_risk: "Supply chain risk scoring",
  advanced_visualizations: "Advanced D3 visualizations",
  api_access: "API access",
  multiple_workspaces: "Multiple client workspaces",
  white_label: "White-label branding",
  client_reports: "Client report generation",
  bulk_assessment: "Bulk assessment tools",
  sso_saml: "SSO/SAML",
  custom_frameworks: "Custom frameworks",
  dedicated_support: "Dedicated support",
  sla_guarantees: "SLA guarantees"
};

const FEATURE_TIER: Record<GatedFeature, Tier> = {
  audit_packages: "PRO",
  evidence_workbook: "PRO",
  compliance_snapshots: "PRO",
  supply_chain_risk: "PRO",
  advanced_visualizations: "PRO",
  api_access: "PRO",
  multiple_workspaces: "CONSULTANT",
  white_label: "CONSULTANT",
  client_reports: "CONSULTANT",
  bulk_assessment: "CONSULTANT",
  sso_saml: "ENTERPRISE",
  custom_frameworks: "ENTERPRISE",
  dedicated_support: "ENTERPRISE",
  sla_guarantees: "ENTERPRISE"
};

export function canAccessFeature(tier: string, feature: GatedFeature): boolean {
  const t = tier.toUpperCase() as Tier;
  const features = TIER_FEATURES[t] ?? TIER_FEATURES.FREE;
  return features.includes(feature);
}

export function getFeatureLabel(feature: GatedFeature): string {
  return FEATURE_LABELS[feature] ?? feature;
}

export function getFeatureTier(feature: GatedFeature): Tier {
  return FEATURE_TIER[feature];
}

export function getAssetLimit(tier: string): number {
  const t = tier.toUpperCase();
  if (t === "PRO" || t === "ENTERPRISE" || t === "CONSULTANT") return Infinity;
  return 10;
}

export function getUsersLimit(tier: string): number {
  const t = tier.toUpperCase();
  if (t === "PRO" || t === "ENTERPRISE" || t === "CONSULTANT") return Infinity;
  return 3;
}

export function getOtherFeaturesInTier(feature: GatedFeature, limit = 3): GatedFeature[] {
  const tier = FEATURE_TIER[feature];
  const features = TIER_FEATURES[tier] ?? [];
  return features.filter((f) => f !== feature).slice(0, limit);
}
