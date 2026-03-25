/**
 * AI Security Standards by CoSAI Layer
 *
 * Maps authoritative frameworks (NIST AI RMF, OWASP LLM, MITRE ATLAS,
 * ISO 42001, CSA AICM) to the five-layer model for secure-by-design AI.
 */

export type CosaiLayer =
  | "LAYER_1_BUSINESS"
  | "LAYER_2_INFORMATION"
  | "LAYER_3_APPLICATION"
  | "LAYER_4_PLATFORM"
  | "LAYER_5_SUPPLY_CHAIN";

export type SecurityStandard =
  | "NIST_AI_RMF"
  | "OWASP_LLM"
  | "MITRE_ATLAS"
  | "ISO_42001"
  | "CSA_AICM"
  | "NIST_COSAIS";

export type SecurityControlCategory = {
  id: string;
  title: string;
  description: string;
  standards: SecurityStandard[];
  keyControls: string[];
};

export type LayerSecurityProfile = {
  layer: CosaiLayer;
  label: string;
  focus: string;
  categories: SecurityControlCategory[];
  references: { standard: SecurityStandard; name: string; url?: string }[];
};

export const LAYER_SECURITY_MAP: Record<CosaiLayer, LayerSecurityProfile> = {
  LAYER_1_BUSINESS: {
    layer: "LAYER_1_BUSINESS",
    label: "Business & Governance",
    focus: "Governance, policy, risk appetite, and accountability",
    categories: [
      {
        id: "governance",
        title: "Governance Structures",
        description: "Roles, responsibilities, and oversight for AI security",
        standards: ["NIST_AI_RMF", "ISO_42001", "CSA_AICM"],
        keyControls: [
          "Define AI governance charter and RACI matrix",
          "Establish risk appetite and tolerance for AI systems",
          "Executive ownership (CAIO/CISO) for AI security",
          "Board-level reporting on AI risk posture"
        ]
      },
      {
        id: "policy",
        title: "Policy & Risk Management",
        description: "AI-specific policies aligned with broader security programs",
        standards: ["NIST_AI_RMF", "ISO_42001", "NIST_COSAIS"],
        keyControls: [
          "AI incident response and escalation plan",
          "Regulatory mapping (EU AI Act, sector rules)",
          "Integrate AI risk with enterprise risk management",
          "Define autonomy levels and human oversight requirements"
        ]
      }
    ],
    references: [
      { standard: "NIST_AI_RMF", name: "NIST AI RMF – Govern" },
      { standard: "ISO_42001", name: "ISO 42001 AI Management System" },
      { standard: "CSA_AICM", name: "CSA AI Controls Matrix" }
    ]
  },

  LAYER_2_INFORMATION: {
    layer: "LAYER_2_INFORMATION",
    label: "Information",
    focus: "Data classification, lineage, and access controls",
    categories: [
      {
        id: "data-governance",
        title: "Data Classification & Provenance",
        description: "Protect training data and prevent poisoning",
        standards: ["NIST_AI_RMF", "OWASP_LLM", "CSA_AICM"],
        keyControls: [
          "Data classification and lineage tracking",
          "Access logging and audit (retain ≥90 days)",
          "Field-level encryption; no hardcoded secrets",
          "Guard against Training Data Poisoning (OWASP LLM03)"
        ]
      },
      {
        id: "access-control",
        title: "Access & Least Privilege",
        description: "RBAC/ABAC for data, models, prompts, and outputs",
        standards: ["NIST_AI_RMF", "CSA_AICM"],
        keyControls: [
          "RBAC/ABAC with least privilege for data and models",
          "Token/memory constraints to prevent sensitive accumulation",
          "Centralized secret management",
          "Protect against Sensitive Information Disclosure (OWASP LLM06)"
        ]
      }
    ],
    references: [
      { standard: "OWASP_LLM", name: "OWASP Top 10 for LLM – LLM03, LLM06" },
      { standard: "CSA_AICM", name: "CSA AICM Data Lineage" }
    ]
  },

  LAYER_3_APPLICATION: {
    layer: "LAYER_3_APPLICATION",
    label: "Application",
    focus: "LLM/agent risks, validation, and supply-chain security",
    categories: [
      {
        id: "input-output",
        title: "Input/Output Handling",
        description: "Guard against prompt injection and insecure outputs",
        standards: ["OWASP_LLM", "MITRE_ATLAS"],
        keyControls: [
          "Sanitize and parameterize prompts; guardrails, privilege separation",
          "Validate and sandbox all outputs before execution",
          "Mitigate Prompt Injection (OWASP LLM01)",
          "Mitigate Insecure Output Handling (OWASP LLM02)"
        ]
      },
      {
        id: "plugins-tools",
        title: "Plugins & Tools",
        description: "Secure orchestration and agent design",
        standards: ["OWASP_LLM", "MITRE_ATLAS"],
        keyControls: [
          "Insecure Plugin Design (OWASP LLM07) – least-privilege tool access",
          "Excessive Agency (OWASP LLM08) – human-in-the-loop for high-risk actions",
          "Overreliance (OWASP LLM09) – validation and fallbacks",
          "Model Theft (OWASP LLM10) – rate limiting, watermarking"
        ]
      },
      {
        id: "resilience",
        title: "Resilience & DoS",
        description: "Protect against denial of service and adversarial attacks",
        standards: ["OWASP_LLM", "MITRE_ATLAS"],
        keyControls: [
          "Model Denial of Service (OWASP LLM04) – rate limiting, monitoring",
          "Adversarial robustness testing per MITRE ATLAS",
          "Input preprocessing and behavioral monitoring"
        ]
      }
    ],
    references: [
      { standard: "OWASP_LLM", name: "OWASP Top 10 for LLM Applications 2025" },
      { standard: "MITRE_ATLAS", name: "MITRE ATLAS – Adversarial Techniques" }
    ]
  },

  LAYER_4_PLATFORM: {
    layer: "LAYER_4_PLATFORM",
    label: "Platform",
    focus: "Infrastructure, compute, and operational security",
    categories: [
      {
        id: "zero-trust",
        title: "Zero Trust & Access",
        description: "Protect training and inference environments",
        standards: ["NIST_AI_RMF", "CSA_AICM", "NIST_COSAIS"],
        keyControls: [
          "Zero Trust with microsegmentation, JIT access, MFA, RBAC",
          "Confidential computing and hardware isolation for GPUs",
          "Encrypt data at rest (AES-256) and in transit (TLS 1.3)",
          "HSMs and key rotation"
        ]
      },
      {
        id: "containers-k8s",
        title: "Containers & Kubernetes",
        description: "Harden compute and runtime",
        standards: ["CSA_AICM", "NIST_COSAIS"],
        keyControls: [
          "Image signing, vulnerability scanning in CI/CD",
          "Immutable infrastructure, runtime protection (KSPM)",
          "Least-privilege node pools",
          "Continuous discovery of AI workloads"
        ]
      },
      {
        id: "operational",
        title: "Operational Security",
        description: "Monitoring and incident response",
        standards: ["NIST_AI_RMF", "CSA_AICM"],
        keyControls: [
          "Patch VMs/containers; endpoint detection",
          "Rate limiting and anomaly detection (prevent DoS, cryptojacking)",
          "Network segmentation and provenance for data pipelines",
          "Full audit logging of agent actions and trajectories"
        ]
      }
    ],
    references: [
      { standard: "CSA_AICM", name: "CSA AI Controls Matrix – Infrastructure" },
      { standard: "NIST_COSAIS", name: "NIST COSAIS Control Overlays" }
    ]
  },

  LAYER_5_SUPPLY_CHAIN: {
    layer: "LAYER_5_SUPPLY_CHAIN",
    label: "Supply Chain",
    focus: "Vendors, models, and dependency security",
    categories: [
      {
        id: "supply-chain",
        title: "Supply Chain Vulnerabilities",
        description: "Vet datasets, models, and dependencies",
        standards: ["OWASP_LLM", "CSA_AICM"],
        keyControls: [
          "Supply Chain Vulnerabilities (OWASP LLM05)",
          "SBOM and dependency scanning for models and datasets",
          "Vet datasets and models; use trusted sources",
          "Data lineage and provenance tracking"
        ]
      },
      {
        id: "vendor-assurance",
        title: "Vendor & Model Assurance",
        description: "Third-party risk and attestation",
        standards: ["CSA_AICM", "ISO_42001"],
        keyControls: [
          "Cryptographic signing for models and artifacts",
          "Version control and rollback procedures",
          "Vendor assurance questionnaires (SOC2, ISO 27001)",
          "Map to NIST AI RMF, ISO 42001 for compliance"
        ]
      }
    ],
    references: [
      { standard: "OWASP_LLM", name: "OWASP LLM05 – Supply Chain" },
      { standard: "CSA_AICM", name: "CSA AICM – Supply Chain Domain" }
    ]
  }
};

/** Get security profile for a layer */
export function getLayerSecurityProfile(layer: CosaiLayer): LayerSecurityProfile {
  return LAYER_SECURITY_MAP[layer];
}

/** All standards referenced across layers */
export const ALL_SECURITY_STANDARDS: { id: SecurityStandard; name: string }[] = [
  { id: "NIST_AI_RMF", name: "NIST AI Risk Management Framework" },
  { id: "OWASP_LLM", name: "OWASP Top 10 for LLM Applications" },
  { id: "MITRE_ATLAS", name: "MITRE ATLAS" },
  { id: "ISO_42001", name: "ISO/IEC 42001 AI Management System" },
  { id: "CSA_AICM", name: "Cloud Security Alliance AI Controls Matrix" },
  { id: "NIST_COSAIS", name: "NIST COSAIS Control Overlays" }
];
