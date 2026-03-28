/**
 * CoSAI Appendix A.7 evidence requirements by layer.
 * Maps required evidence items to platform sources.
 */

export type CosaiLayer = "L1" | "L2" | "L3" | "L4" | "L5";

export type EvidenceCategory =
  | "Oversight"
  | "Technical"
  | "Operational"
  | "Assessment"
  | "Attestation";

export type EvidenceItem = {
  id: string;
  layer: CosaiLayer;
  name: string;
  category: EvidenceCategory;
  requiredFor: string[];
  howToCollect: string;
  prismaModel: string;
  prismaQuery: string;
};

export const EVIDENCE_ITEMS: EvidenceItem[] = [
  // L1 Business
  {
    id: "l1-ai-policy",
    layer: "L1",
    name: "AI Policy",
    category: "Oversight",
    requiredFor: ["EU_AI_ACT", "NIST_AI_RMF", "ISO_42001", "COSAI_SRF"],
    howToCollect: "Organization settings, regulatory profile",
    prismaModel: "Organization",
    prismaQuery: "organization.findUnique"
  },
  {
    id: "l1-risk-register",
    layer: "L1",
    name: "Risk Register",
    category: "Operational",
    requiredFor: ["EU_AI_ACT", "NIST_AI_RMF", "COSAI_SRF"],
    howToCollect: "Risk Register per asset",
    prismaModel: "RiskRegister",
    prismaQuery: "riskRegister.findMany"
  },
  {
    id: "l1-training-records",
    layer: "L1",
    name: "Training Records",
    category: "Operational",
    requiredFor: ["EU_AI_ACT", "NIST_AI_RMF"],
    howToCollect: "Maturity assessment, training documentation",
    prismaModel: "MaturityAssessment",
    prismaQuery: "maturityAssessment.findMany"
  },
  {
    id: "l1-audit-reports",
    layer: "L1",
    name: "Audit Reports",
    category: "Assessment",
    requiredFor: ["EU_AI_ACT", "ISO_42001", "COSAI_SRF"],
    howToCollect: "Audit Log",
    prismaModel: "AuditLog",
    prismaQuery: "auditLog.findMany"
  },
  {
    id: "l1-regulatory-mapping",
    layer: "L1",
    name: "Regulatory Mapping",
    category: "Oversight",
    requiredFor: ["EU_AI_ACT", "NIST_AI_RMF", "COSAI_SRF"],
    howToCollect: "Regulatory Cascade, Compliance frameworks",
    prismaModel: "ComplianceFramework",
    prismaQuery: "complianceFramework.findMany"
  },
  {
    id: "l1-maturity-assessment",
    layer: "L1",
    name: "Maturity Assessment",
    category: "Assessment",
    requiredFor: ["NIST_AI_RMF", "ISO_42001", "COSAI_SRF"],
    howToCollect: "Maturity Assessment page",
    prismaModel: "MaturityAssessment",
    prismaQuery: "maturityAssessment.findFirst"
  },
  // L2 Information
  {
    id: "l2-dpias",
    layer: "L2",
    name: "DPIAs",
    category: "Assessment",
    requiredFor: ["EU_AI_ACT", "GDPR"],
    howToCollect: "Assessments, Data & Privacy settings",
    prismaModel: "Assessment",
    prismaQuery: "assessment.findMany"
  },
  {
    id: "l2-dataset-cards",
    layer: "L2",
    name: "Dataset Cards",
    category: "Technical",
    requiredFor: ["EU_AI_ACT", "NIST_AI_RMF"],
    howToCollect: "Artifact Cards (DATASET type)",
    prismaModel: "ArtifactCard",
    prismaQuery: "artifactCard.findMany"
  },
  {
    id: "l2-data-lineage",
    layer: "L2",
    name: "Data Lineage Records",
    category: "Technical",
    requiredFor: ["EU_AI_ACT", "NIST_AI_RMF", "COSAI_SRF"],
    howToCollect: "Data Lineage page",
    prismaModel: "DataLineageRecord",
    prismaQuery: "dataLineageRecord.findMany"
  },
  {
    id: "l2-consent-records",
    layer: "L2",
    name: "Consent Records",
    category: "Oversight",
    requiredFor: ["EU_AI_ACT", "GDPR"],
    howToCollect: "Data & Privacy settings, Master Data",
    prismaModel: "MasterDataEntity",
    prismaQuery: "masterDataEntity.findMany"
  },
  {
    id: "l2-classification-policies",
    layer: "L2",
    name: "Classification Policies",
    category: "Oversight",
    requiredFor: ["EU_AI_ACT", "NIST_AI_RMF", "COSAI_SRF"],
    howToCollect: "Data policy documents",
    prismaModel: "DataGovernancePolicy",
    prismaQuery: "dataGovernancePolicy.findMany"
  },
  {
    id: "l2-stewardship",
    layer: "L2",
    name: "Stewardship Assignments",
    category: "Oversight",
    requiredFor: ["NIST_AI_RMF", "COSAI_SRF"],
    howToCollect: "Master Data entities with steward",
    prismaModel: "MasterDataEntity",
    prismaQuery: "masterDataEntity.findMany"
  },
  // L3 Application
  {
    id: "l3-architecture-docs",
    layer: "L3",
    name: "Architecture Docs",
    category: "Technical",
    requiredFor: ["EU_AI_ACT", "NIST_AI_RMF", "COSAI_SRF"],
    howToCollect: "AI Asset details, Artifact Cards",
    prismaModel: "AIAsset",
    prismaQuery: "aIAsset.findMany"
  },
  {
    id: "l3-safety-tests",
    layer: "L3",
    name: "Safety Tests",
    category: "Assessment",
    requiredFor: ["EU_AI_ACT", "NIST_AI_RMF"],
    howToCollect: "Scan Records (RED_TEAM, etc.)",
    prismaModel: "ScanRecord",
    prismaQuery: "scanRecord.findMany"
  },
  {
    id: "l3-override-tests",
    layer: "L3",
    name: "Override Test Results",
    category: "Assessment",
    requiredFor: ["EU_AI_ACT", "COSAI_SRF"],
    howToCollect: "Assessments, Control attestations",
    prismaModel: "ControlAttestation",
    prismaQuery: "controlAttestation.findMany"
  },
  {
    id: "l3-agent-telemetry",
    layer: "L3",
    name: "Agent Telemetry",
    category: "Technical",
    requiredFor: ["EU_AI_ACT", "NIST_AI_RMF", "OWASP_AIVSS"],
    howToCollect: "Telemetry & Monitoring",
    prismaModel: "ScanRecord",
    prismaQuery: "scanRecord.findMany"
  },
  {
    id: "l3-control-attestations",
    layer: "L3",
    name: "Control Attestations",
    category: "Attestation",
    requiredFor: ["EU_AI_ACT", "NIST_AI_RMF", "ISO_42001", "COSAI_SRF", "OWASP_AIVSS", "OWASP_LLM"],
    howToCollect: "Assessments, Asset detail",
    prismaModel: "ControlAttestation",
    prismaQuery: "controlAttestation.findMany"
  },
  {
    id: "l3-gap-analysis",
    layer: "L3",
    name: "Gap Analysis",
    category: "Assessment",
    requiredFor: ["NIST_AI_RMF", "COSAI_SRF"],
    howToCollect: "Gap Analysis report",
    prismaModel: "Assessment",
    prismaQuery: "assessment.findMany"
  },
  {
    id: "l3-accountability",
    layer: "L3",
    name: "Accountability Assignments",
    category: "Oversight",
    requiredFor: ["EU_AI_ACT", "NIST_AI_RMF", "COSAI_SRF"],
    howToCollect: "Accountability Matrix",
    prismaModel: "AccountabilityAssignment",
    prismaQuery: "accountabilityAssignment.findMany"
  },
  // L4 Platform
  {
    id: "l4-soc2",
    layer: "L4",
    name: "SOC2 Reports",
    category: "Attestation",
    requiredFor: ["NIST_AI_RMF", "ISO_42001"],
    howToCollect: "Vendor Assurance records",
    prismaModel: "VendorAssurance",
    prismaQuery: "vendorAssurance.findMany"
  },
  {
    id: "l4-guardrail-configs",
    layer: "L4",
    name: "Guardrail Configs",
    category: "Technical",
    requiredFor: ["EU_AI_ACT", "NIST_AI_RMF"],
    howToCollect: "Platform settings, Telemetry",
    prismaModel: "ScanRecord",
    prismaQuery: "scanRecord.findMany"
  },
  {
    id: "l4-model-registry",
    layer: "L4",
    name: "Model Registry",
    category: "Technical",
    requiredFor: ["EU_AI_ACT", "NIST_AI_RMF", "COSAI_SRF"],
    howToCollect: "Model Registry, Artifact Cards",
    prismaModel: "ArtifactCard",
    prismaQuery: "artifactCard.findMany"
  },
  {
    id: "l4-scan-records",
    layer: "L4",
    name: "Scan Records",
    category: "Technical",
    requiredFor: ["EU_AI_ACT", "NIST_AI_RMF", "COSAI_SRF"],
    howToCollect: "Scan Coverage page",
    prismaModel: "ScanRecord",
    prismaQuery: "scanRecord.findMany"
  },
  {
    id: "l4-drift-logs",
    layer: "L4",
    name: "Drift Detection Logs",
    category: "Operational",
    requiredFor: ["NIST_AI_RMF", "COSAI_SRF"],
    howToCollect: "Drift Detection page",
    prismaModel: "ScanRecord",
    prismaQuery: "scanRecord.findMany"
  },
  {
    id: "l4-alert-history",
    layer: "L4",
    name: "Alert History",
    category: "Operational",
    requiredFor: ["NIST_AI_RMF", "COSAI_SRF"],
    howToCollect: "Alert Engine, Telemetry",
    prismaModel: "ScanRecord",
    prismaQuery: "scanRecord.findMany"
  },
  // L5 Supply Chain
  {
    id: "l5-model-cards",
    layer: "L5",
    name: "Model Cards",
    category: "Technical",
    requiredFor: ["EU_AI_ACT", "NIST_AI_RMF", "COSAI_SRF"],
    howToCollect: "Artifact Cards",
    prismaModel: "ArtifactCard",
    prismaQuery: "artifactCard.findMany"
  },
  {
    id: "l5-training-data-docs",
    layer: "L5",
    name: "Training Data Docs",
    category: "Technical",
    requiredFor: ["EU_AI_ACT", "NIST_AI_RMF"],
    howToCollect: "Artifact Cards (DATASET), Data Cards",
    prismaModel: "ArtifactCard",
    prismaQuery: "artifactCard.findMany"
  },
  {
    id: "l5-red-team",
    layer: "L5",
    name: "Red Team Reports",
    category: "Assessment",
    requiredFor: ["EU_AI_ACT", "NIST_AI_RMF"],
    howToCollect: "Scan Records (RED_TEAM)",
    prismaModel: "ScanRecord",
    prismaQuery: "scanRecord.findMany"
  },
  {
    id: "l5-slsa",
    layer: "L5",
    name: "SLSA Attestations",
    category: "Attestation",
    requiredFor: ["NIST_AI_RMF", "COSAI_SRF"],
    howToCollect: "Vendor Assurance (SLSA level)",
    prismaModel: "VendorAssurance",
    prismaQuery: "vendorAssurance.findMany"
  },
  {
    id: "l5-vendor-assurance",
    layer: "L5",
    name: "Vendor Assurance Records",
    category: "Attestation",
    requiredFor: ["EU_AI_ACT", "NIST_AI_RMF", "ISO_42001", "COSAI_SRF"],
    howToCollect: "Vendors page",
    prismaModel: "VendorAssurance",
    prismaQuery: "vendorAssurance.findMany"
  },
  {
    id: "l5-license-records",
    layer: "L5",
    name: "License Records",
    category: "Oversight",
    requiredFor: ["EU_AI_ACT", "NIST_AI_RMF"],
    howToCollect: "Artifact Cards, Scan Records (LICENSE)",
    prismaModel: "ScanRecord",
    prismaQuery: "scanRecord.findMany"
  }
];

export const REGULATION_OPTIONS = [
  { value: "EU_AI_ACT", label: "EU AI Act" },
  { value: "NIST_AI_RMF", label: "NIST AI RMF" },
  { value: "ISO_42001", label: "ISO 42001" },
  { value: "COSAI_SRF", label: "CoSAI SRF" },
  { value: "OWASP_LLM", label: "OWASP Top 10 for LLM" },
  { value: "OWASP_AIVSS", label: "OWASP AIVSS" },
  { value: "SR_11_7", label: "SR 11-7" },
  { value: "CUSTOM", label: "Custom" }
] as const;

export function getEvidenceByLayer(layer?: CosaiLayer): EvidenceItem[] {
  if (!layer) return EVIDENCE_ITEMS;
  return EVIDENCE_ITEMS.filter((e) => e.layer === layer);
}
