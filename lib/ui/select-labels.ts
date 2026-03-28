/**
 * Human-readable labels for `<select>` display text. Stored/submitted values stay enum tokens.
 */

export const ORG_ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  CAIO: "CAIO",
  ANALYST: "Analyst",
  MEMBER: "Member",
  VIEWER: "Viewer",
  AUDITOR: "Auditor"
};

export function orgRoleLabel(role: string): string {
  return ORG_ROLE_LABELS[role] ?? role;
}

export const MASTER_DATA_ENTITY_TYPE_LABELS: Record<string, string> = {
  ALL: "All",
  CUSTOMER: "Customer",
  PRODUCT: "Product",
  VENDOR: "Vendor",
  EMPLOYEE: "Employee",
  FINANCE: "Finance",
  LOCATION: "Location",
  OTHER: "Other"
};

export const DATA_CLASSIFICATION_LABELS: Record<string, string> = {
  ALL: "All",
  PUBLIC: "Public",
  INTERNAL: "Internal",
  CONFIDENTIAL: "Confidential",
  RESTRICTED: "Restricted"
};

export const AI_ACCESS_POLICY_LABELS: Record<string, string> = {
  ALL: "All",
  OPEN: "Open",
  GOVERNED: "Governed",
  RESTRICTED: "Restricted",
  PROHIBITED: "Prohibited"
};

export const ACCOUNTABILITY_LAYER_LABELS: Record<string, string> = {
  LAYER_1_BUSINESS: "Layer 1: Business",
  LAYER_2_INFORMATION: "Layer 2: Information",
  LAYER_3_APPLICATION: "Layer 3: Application",
  LAYER_4_PLATFORM: "Layer 4: Platform",
  LAYER_5_SUPPLY_CHAIN: "Layer 5: Supply Chain"
};

export const GOVERNANCE_POLICY_TYPE_LABELS: Record<string, string> = {
  CLASSIFICATION: "Classification",
  RETENTION: "Retention",
  ACCESS: "Access",
  QUALITY: "Quality",
  PRIVACY: "Privacy"
};

export const PIPELINE_TYPE_LABELS: Record<string, string> = {
  ETL: "ETL",
  API: "API",
  STREAM: "Stream",
  BATCH: "Batch",
  MANUAL: "Manual"
};

export const REFRESH_FREQUENCY_LABELS: Record<string, string> = {
  REALTIME: "Real-time",
  HOURLY: "Hourly",
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly"
};

export const EU_RISK_LEVEL_SHORT_LABELS: Record<string, string> = {
  MINIMAL: "Minimal",
  LIMITED: "Limited",
  HIGH: "High",
  UNACCEPTABLE: "Unacceptable"
};

export const ASSET_TYPE_SHORT_LABELS: Record<string, string> = {
  MODEL: "Model",
  AGENT: "Agent",
  APPLICATION: "Application",
  PIPELINE: "Pipeline"
};
