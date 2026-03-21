/**
 * VRA (Vendor Risk Assessment) question library – from AI Vendor types and VRA security questions.
 * Questions are keyed by vendor type applicability.
 */
import type { VendorType } from "@prisma/client";

export type VraQuestion = {
  id: string;
  riskArea: string;
  vendorTypes: VendorType[];
  text: string;
  attestation?: string;
};

export const VRA_QUESTIONS: VraQuestion[] = [
  // --- Core AI Platform & Infrastructure ---
  {
    id: "INFRA_DATA_HANDLING",
    riskArea: "Data handling & isolation",
    vendorTypes: ["INFRASTRUCTURE", "MODEL_PROVIDER", "DATA_PROVIDER", "CONSULTING"],
    text: "Provide architecture diagrams depicting how one customer is prevented from accessing another customer's data, and where data resides.",
    attestation: "SOC2/ISO 27001+"
  },
  {
    id: "INFRA_ENCRYPTION",
    riskArea: "Encryption (at rest / in transit)",
    vendorTypes: ["INFRASTRUCTURE", "MODEL_PROVIDER", "DATA_PROVIDER", "CONSULTING", "RESELLER"],
    text: "Confirm encryption at rest and in transit.",
    attestation: "SOC2/ISO 27001"
  },
  {
    id: "INFRA_SECURITY_CERTS",
    riskArea: "Security certifications",
    vendorTypes: ["INFRASTRUCTURE", "MODEL_PROVIDER", "DATA_PROVIDER", "CONSULTING", "RESELLER"],
    text: "Provide SOC2, ISO 27001, and/or FedRAMP certifications.",
    attestation: "SOC2/ISO 27001"
  },
  {
    id: "INFRA_INCIDENT_RESPONSE",
    riskArea: "Incident response – SLAs & monitoring",
    vendorTypes: ["INFRASTRUCTURE", "MODEL_PROVIDER", "DATA_PROVIDER", "CONSULTING", "RESELLER"],
    text: "Describe AI events generated and how models are monitored.",
    attestation: "SOC2/ISO 27001+"
  },
  {
    id: "INFRA_SHARED_RESPONSIBILITY",
    riskArea: "Shared responsibility – boundaries",
    vendorTypes: ["INFRASTRUCTURE", "MODEL_PROVIDER", "CONSULTING"],
    text: "Point to documents that clearly describe who is responsible for what. Describe which AI events and logs the customer needs to monitor/collect.",
    attestation: "Point to documents"
  },
  {
    id: "INFRA_ADVERSARIAL_BIAS",
    riskArea: "Adversarial or bias model testing",
    vendorTypes: ["INFRASTRUCTURE", "MODEL_PROVIDER"],
    text: "Describe adversarial or bias model testing expected by the customer.",
    attestation: "SOC2/ISO 27001+"
  },
  // --- Pre-trained Model / Algorithm Providers ---
  {
    id: "MODEL_INTEGRITY",
    riskArea: "Model integrity & benchmark evidence",
    vendorTypes: ["MODEL_PROVIDER"],
    text: "Provide 3rd party certification of model benchmarks. Provide robustness metrics (adversarial attacks, jailbreaks).",
    attestation: "SOC2/ISO 27001+"
  },
  {
    id: "MODEL_TRAINING_DATA",
    riskArea: "Training data – provenance & bias mitigation",
    vendorTypes: ["MODEL_PROVIDER", "DATA_PROVIDER"],
    text: "Provide proof of data opt-out (GDPR, CCPA). List 3rd party datasets (Common Crawl, books3, the-stack, etc.).",
    attestation: "Proof of opt-out"
  },
  {
    id: "MODEL_RESPONSIBLE_AI",
    riskArea: "Responsible AI – governance / explainability",
    vendorTypes: ["MODEL_PROVIDER"],
    text: "Provide System/Model cards.",
    attestation: "Model cards"
  },
  {
    id: "MODEL_LICENSING_IP",
    riskArea: "Usage licensing & IP indemnification",
    vendorTypes: ["MODEL_PROVIDER", "CONSULTING", "RESELLER"],
    text: "Provide license and acceptable use policy terms.",
    attestation: "Contract terms"
  },
  {
    id: "MODEL_EU_AI_ACT",
    riskArea: "Regulatory alignment for sensitive data",
    vendorTypes: ["MODEL_PROVIDER"],
    text: "Provide mapping of model to EU AI Act risk case categories.",
    attestation: "Regulatory mapping"
  },
  {
    id: "MODEL_USER_DATA_TRAINING",
    riskArea: "Training data usage",
    vendorTypes: ["MODEL_PROVIDER"],
    text: "Provide proof that user data/prompts are not used for training.",
    attestation: "Proof/documentation"
  },
  // --- Data Labeling & Human-in-the-Loop Services ---
  {
    id: "LABEL_WORKFORCE_VETTING",
    riskArea: "Workforce vetting & background checks",
    vendorTypes: ["DATA_PROVIDER"],
    text: "Specify which roles or regions are exempt from screening. Describe cadence for re-screening gig workers or contractors.",
    attestation: "SOC2/ISO 27001+"
  },
  {
    id: "LABEL_CONFIDENTIAL_DATA",
    riskArea: "Confidential data – controls, VDI / VPC use",
    vendorTypes: ["DATA_PROVIDER"],
    text: "Provide evidence of DLP controls. Describe GeoIP, embargo IP restrictions. Provide penetration results for VDI if contractor provided.",
    attestation: "DLP/VDI documentation"
  },
  {
    id: "LABEL_ANNOTATION_QA",
    riskArea: "Annotation QA processes & accuracy metrics",
    vendorTypes: ["DATA_PROVIDER"],
    text: "Provide QA methodology documentation. Provide prior quarter metrics dashboard.",
    attestation: "ISO 9001+"
  },
  {
    id: "LABEL_SUBPROCESSORS",
    riskArea: "Sub-processor list and cross-border data flow",
    vendorTypes: ["INFRASTRUCTURE", "MODEL_PROVIDER", "DATA_PROVIDER", "RESELLER"],
    text: "Provide sub-processor list and describe change control. Provide data flow diagram including geographical data locations. Provide audit results of 3rd sub-processors. Provide opt-out options for sub-processors.",
    attestation: "Sub-processor documentation"
  },
  {
    id: "LABEL_RETENTION_DELETION",
    riskArea: "Retention / secure deletion – policy",
    vendorTypes: ["INFRASTRUCTURE", "MODEL_PROVIDER", "DATA_PROVIDER", "CONSULTING"],
    text: "Can the customer define retention policy? Provide certificates of data deletion/destruction.",
    attestation: "SOC2/ISO 27001+"
  },
  // --- AI Consulting & Professional Services ---
  {
    id: "CONSULT_SCOPE_SLAS",
    riskArea: "Scope definition, deliverable SLAs & success KPIs",
    vendorTypes: ["CONSULTING"],
    text: "Provide examples of AI KPI dashboards and prior project scorecards.",
    attestation: "Project documentation"
  },
  {
    id: "CONSULT_ACCESS_CONTROLS",
    riskArea: "Access controls when working in client environments",
    vendorTypes: ["CONSULTING"],
    text: "Provide restricted data and system access requirements (e.g., VPN, VDI, Jupyter Hub, IDE).",
    attestation: "Access policy"
  },
  {
    id: "CONSULT_DATA_OWNERSHIP",
    riskArea: "Data ownership of code / models produced",
    vendorTypes: ["CONSULTING"],
    text: "Provide contracts addressing I.P. or joint ownership. Provide SBOM breakdowns.",
    attestation: "Contract/SBOM"
  },
  {
    id: "CONSULT_SECURITY_POSTURE",
    riskArea: "Security posture & certifications of consulting firm",
    vendorTypes: ["CONSULTING"],
    text: "Provide SOC2, ISO 27001+, and 3rd party Attestation results.",
    attestation: "SOC2/ISO 27001+"
  },
  {
    id: "CONSULT_POST_ENGAGEMENT",
    riskArea: "Post-engagement – data destruction / retention",
    vendorTypes: ["CONSULTING"],
    text: "Provide certificates of data deletion/destruction. Process for sanitizing IDE (Jira, Confluence, Git) and wiping local developer workstations/VDI caches.",
    attestation: "Destruction certificates"
  },
  // --- Software, VARs, & Distributors ---
  {
    id: "RESELLER_PATCH_UPDATE",
    riskArea: "Clarification of patch / update responsibility",
    vendorTypes: ["RESELLER"],
    text: "Provide model/dataset/tool patch/update schedule. Provide EOL matrix by product.",
    attestation: "Patch/EOL matrix"
  },
  {
    id: "RESELLER_CONTROLS_ALIGNMENT",
    riskArea: "Alignment of reseller security controls with OEM",
    vendorTypes: ["RESELLER"],
    text: "Provide controls hardening benchmark. Provide contract clauses ensuring vendor cannot weaken security settings over time.",
    attestation: "Benchmark/contract"
  },
  {
    id: "RESELLER_SUPPORT_ESCALATION",
    riskArea: "Support & escalation path delineation",
    vendorTypes: ["RESELLER"],
    text: "Provide contact names and numbers. Provide incident response process.",
    attestation: "Contact/process documentation"
  },
  {
    id: "RESELLER_SUPPLY_CHAIN",
    riskArea: "Supply chain – vetting for downstream providers",
    vendorTypes: ["RESELLER"],
    text: "Provide current sub-provider inventory with geographic locations and data roles. Provide audit results of 3rd sub-processors. Provide opt-out options for sub-processors.",
    attestation: "Sub-provider inventory"
  },
  {
    id: "RESELLER_LICENSING",
    riskArea: "Licensing terms and warranty coverage",
    vendorTypes: ["RESELLER"],
    text: "Provide licensing terms and warranty coverage. (Legal to provide input.)",
    attestation: "Legal"
  }
];

export function getQuestionsForVendorType(vendorType: VendorType | null): VraQuestion[] {
  if (!vendorType) return VRA_QUESTIONS;
  return VRA_QUESTIONS.filter((q) => q.vendorTypes.includes(vendorType));
}

export function getRiskAreasForVendorType(vendorType: VendorType | null): string[] {
  const questions = getQuestionsForVendorType(vendorType);
  const areas = new Set(questions.map((q) => q.riskArea));
  return Array.from(areas);
}
