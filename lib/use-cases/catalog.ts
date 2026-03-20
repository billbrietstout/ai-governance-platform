/**
 * AI Use Case Library – pre-built governance templates.
 */

export type UseCaseVertical =
  | "MANUFACTURING"
  | "FINANCIAL"
  | "HEALTHCARE"
  | "HR"
  | "RETAIL"
  | "CUSTOMER_SERVICE";

export type UseCase = {
  id: string;
  name: string;
  description: string;
  vertical: UseCaseVertical;
  assetType: "MODEL" | "AGENT" | "APPLICATION" | "PIPELINE";
  euRiskLevel: "MINIMAL" | "LIMITED" | "HIGH" | "UNACCEPTABLE";
  autonomyLevel: "L0" | "L1" | "L2" | "L3" | "L4" | "L5";
  businessFunction: string;
  typicalDataTypes: string[];
  applicableRegulations: string[];
  requiredControls: string[];
  estimatedMaturity: number;
  governanceComplexity: "LOW" | "MEDIUM" | "HIGH";
  templateInputs: {
    assetType: "MODEL" | "AGENT" | "APPLICATION" | "PIPELINE";
    description: string;
    businessFunction:
      | "HR"
      | "Finance"
      | "Operations"
      | "Customer Service"
      | "Healthcare"
      | "Legal"
      | "Other";
    decisionsAffectingPeople: boolean;
    interactsWithEndUsers: boolean;
    deployment: "EU_market" | "US_only" | "Global" | "Internal_only";
    verticals: string[];
    autonomyLevel: "L0" | "L1" | "L2" | "L3" | "L4" | "L5";
    dataTypes: string[];
    euResidentsData: "Yes" | "No" | "Unknown";
    expectedRiskLevel: "Low" | "Medium" | "High" | "Critical";
    vulnerablePopulations: boolean;
  };
};

export const USE_CASES: UseCase[] = [
  // Manufacturing
  {
    id: "mfg-equipment-failure",
    name: "Equipment Failure Predictor",
    description:
      "Predictive maintenance model that analyzes sensor data to forecast equipment failures before they occur.",
    vertical: "MANUFACTURING",
    assetType: "MODEL",
    euRiskLevel: "MINIMAL",
    autonomyLevel: "L2",
    businessFunction: "Operations",
    typicalDataTypes: ["Proprietary", "Public"],
    applicableRegulations: ["EU_AI_ACT", "ISO_42001"],
    requiredControls: ["Risk management", "Data quality", "Human oversight"],
    estimatedMaturity: 2,
    governanceComplexity: "LOW",
    templateInputs: {
      assetType: "MODEL",
      description: "Predictive maintenance for equipment failure",
      businessFunction: "Operations",
      decisionsAffectingPeople: false,
      interactsWithEndUsers: false,
      deployment: "Global",
      verticals: ["GENERAL"],
      autonomyLevel: "L2",
      dataTypes: ["Proprietary"],
      euResidentsData: "Unknown",
      expectedRiskLevel: "Low",
      vulnerablePopulations: false
    }
  },
  {
    id: "mfg-production-schedule",
    name: "Production Schedule Optimizer",
    description:
      "AI system that optimizes production schedules based on demand forecasts and resource availability.",
    vertical: "MANUFACTURING",
    assetType: "APPLICATION",
    euRiskLevel: "MINIMAL",
    autonomyLevel: "L3",
    businessFunction: "Operations",
    typicalDataTypes: ["Proprietary", "Public"],
    applicableRegulations: ["EU_AI_ACT", "NIST_AI_RMF"],
    requiredControls: ["Risk management", "Transparency"],
    estimatedMaturity: 2,
    governanceComplexity: "LOW",
    templateInputs: {
      assetType: "APPLICATION",
      description: "Production schedule optimization",
      businessFunction: "Operations",
      decisionsAffectingPeople: false,
      interactsWithEndUsers: false,
      deployment: "Global",
      verticals: ["GENERAL"],
      autonomyLevel: "L3",
      dataTypes: ["Proprietary"],
      euResidentsData: "No",
      expectedRiskLevel: "Low",
      vulnerablePopulations: false
    }
  },
  {
    id: "mfg-quality-vision",
    name: "Quality Control Vision System",
    description:
      "Computer vision system for automated defect detection in manufacturing quality control.",
    vertical: "MANUFACTURING",
    assetType: "APPLICATION",
    euRiskLevel: "LIMITED",
    autonomyLevel: "L4",
    businessFunction: "Operations",
    typicalDataTypes: ["Proprietary"],
    applicableRegulations: ["EU_AI_ACT", "ISO_42001"],
    requiredControls: ["Transparency", "Human oversight", "Data governance"],
    estimatedMaturity: 3,
    governanceComplexity: "MEDIUM",
    templateInputs: {
      assetType: "APPLICATION",
      description: "Quality control vision for defect detection",
      businessFunction: "Operations",
      decisionsAffectingPeople: false,
      interactsWithEndUsers: false,
      deployment: "Global",
      verticals: ["GENERAL"],
      autonomyLevel: "L4",
      dataTypes: ["Proprietary"],
      euResidentsData: "No",
      expectedRiskLevel: "Medium",
      vulnerablePopulations: false
    }
  },
  {
    id: "mfg-supply-chain",
    name: "Supply Chain Optimizer",
    description:
      "Agent that optimizes inventory levels, supplier selection, and logistics based on demand and constraints.",
    vertical: "MANUFACTURING",
    assetType: "AGENT",
    euRiskLevel: "MINIMAL",
    autonomyLevel: "L3",
    businessFunction: "Operations",
    typicalDataTypes: ["Proprietary", "Financial"],
    applicableRegulations: ["EU_AI_ACT", "NIST_AI_RMF"],
    requiredControls: ["Risk management", "Audit trail"],
    estimatedMaturity: 2,
    governanceComplexity: "LOW",
    templateInputs: {
      assetType: "AGENT",
      description: "Supply chain and inventory optimization",
      businessFunction: "Operations",
      decisionsAffectingPeople: false,
      interactsWithEndUsers: false,
      deployment: "Global",
      verticals: ["GENERAL"],
      autonomyLevel: "L3",
      dataTypes: ["Proprietary", "Financial"],
      euResidentsData: "No",
      expectedRiskLevel: "Low",
      vulnerablePopulations: false
    }
  },
  // Financial
  {
    id: "fin-credit-scoring",
    name: "Credit Scoring Model",
    description:
      "Model that assesses creditworthiness for lending decisions. High-risk under EU AI Act Annex III.",
    vertical: "FINANCIAL",
    assetType: "MODEL",
    euRiskLevel: "HIGH",
    autonomyLevel: "L2",
    businessFunction: "Finance",
    typicalDataTypes: ["Financial", "PII"],
    applicableRegulations: ["EU_AI_ACT_ANNEX_III", "SR_11_7", "GDPR_AI", "SEC_AI"],
    requiredControls: [
      "Risk management",
      "Data governance",
      "Human oversight",
      "Transparency",
      "Conformity assessment"
    ],
    estimatedMaturity: 5,
    governanceComplexity: "HIGH",
    templateInputs: {
      assetType: "MODEL",
      description: "Credit scoring for lending decisions",
      businessFunction: "Finance",
      decisionsAffectingPeople: true,
      interactsWithEndUsers: false,
      deployment: "Global",
      verticals: ["FINANCIAL_SERVICES"],
      autonomyLevel: "L2",
      dataTypes: ["Financial", "PII"],
      euResidentsData: "Yes",
      expectedRiskLevel: "High",
      vulnerablePopulations: false
    }
  },
  {
    id: "fin-fraud-detection",
    name: "Fraud Detection Agent",
    description:
      "Real-time agent that flags suspicious transactions and blocks fraudulent activity.",
    vertical: "FINANCIAL",
    assetType: "AGENT",
    euRiskLevel: "HIGH",
    autonomyLevel: "L4",
    businessFunction: "Finance",
    typicalDataTypes: ["Financial", "PII"],
    applicableRegulations: ["EU_AI_ACT", "DORA", "SR_11_7", "GDPR_AI"],
    requiredControls: ["Risk management", "Data governance", "Human oversight", "Audit trail"],
    estimatedMaturity: 4,
    governanceComplexity: "HIGH",
    templateInputs: {
      assetType: "AGENT",
      description: "Real-time fraud detection and blocking",
      businessFunction: "Finance",
      decisionsAffectingPeople: true,
      interactsWithEndUsers: false,
      deployment: "Global",
      verticals: ["FINANCIAL_SERVICES"],
      autonomyLevel: "L4",
      dataTypes: ["Financial", "PII"],
      euResidentsData: "Yes",
      expectedRiskLevel: "High",
      vulnerablePopulations: false
    }
  },
  {
    id: "fin-aml-monitor",
    name: "AML Transaction Monitor",
    description:
      "Anti-money laundering system that screens transactions and generates suspicious activity reports.",
    vertical: "FINANCIAL",
    assetType: "APPLICATION",
    euRiskLevel: "HIGH",
    autonomyLevel: "L3",
    businessFunction: "Finance",
    typicalDataTypes: ["Financial", "PII"],
    applicableRegulations: ["EU_AI_ACT", "DORA", "SR_11_7", "GDPR_AI"],
    requiredControls: ["Risk management", "Data governance", "Human oversight", "Audit trail"],
    estimatedMaturity: 5,
    governanceComplexity: "HIGH",
    templateInputs: {
      assetType: "APPLICATION",
      description: "AML transaction monitoring and SAR generation",
      businessFunction: "Finance",
      decisionsAffectingPeople: true,
      interactsWithEndUsers: false,
      deployment: "Global",
      verticals: ["FINANCIAL_SERVICES"],
      autonomyLevel: "L3",
      dataTypes: ["Financial", "PII"],
      euResidentsData: "Yes",
      expectedRiskLevel: "High",
      vulnerablePopulations: false
    }
  },
  {
    id: "fin-algo-trading",
    name: "Algorithmic Trading System",
    description:
      "Autonomous trading system that executes trades based on market signals and strategies.",
    vertical: "FINANCIAL",
    assetType: "AGENT",
    euRiskLevel: "LIMITED",
    autonomyLevel: "L5",
    businessFunction: "Finance",
    typicalDataTypes: ["Financial", "Proprietary"],
    applicableRegulations: ["EU_AI_ACT", "SEC_AI", "SR_11_7", "DORA"],
    requiredControls: ["Risk management", "Human oversight", "Kill switch", "Audit trail"],
    estimatedMaturity: 4,
    governanceComplexity: "HIGH",
    templateInputs: {
      assetType: "AGENT",
      description: "Algorithmic trading execution",
      businessFunction: "Finance",
      decisionsAffectingPeople: false,
      interactsWithEndUsers: false,
      deployment: "Global",
      verticals: ["FINANCIAL_SERVICES"],
      autonomyLevel: "L5",
      dataTypes: ["Financial", "Proprietary"],
      euResidentsData: "Unknown",
      expectedRiskLevel: "High",
      vulnerablePopulations: false
    }
  },
  // Healthcare
  {
    id: "hc-clinical-support",
    name: "Clinical Decision Support",
    description: "AI system that assists clinicians with diagnosis and treatment recommendations.",
    vertical: "HEALTHCARE",
    assetType: "APPLICATION",
    euRiskLevel: "HIGH",
    autonomyLevel: "L2",
    businessFunction: "Healthcare",
    typicalDataTypes: ["Health", "PII"],
    applicableRegulations: ["EU_AI_ACT_MEDICAL", "FDA_SAMD", "HIPAA_AI", "GDPR_AI"],
    requiredControls: [
      "Risk management",
      "Data governance",
      "Human oversight",
      "Clinical validation"
    ],
    estimatedMaturity: 5,
    governanceComplexity: "HIGH",
    templateInputs: {
      assetType: "APPLICATION",
      description: "Clinical decision support for diagnosis and treatment",
      businessFunction: "Healthcare",
      decisionsAffectingPeople: true,
      interactsWithEndUsers: true,
      deployment: "Global",
      verticals: ["HEALTHCARE"],
      autonomyLevel: "L2",
      dataTypes: ["Health", "PII"],
      euResidentsData: "Yes",
      expectedRiskLevel: "High",
      vulnerablePopulations: true
    }
  },
  {
    id: "hc-medical-image",
    name: "Medical Image Analysis",
    description: "Model for analyzing medical images (X-rays, MRIs) to detect abnormalities.",
    vertical: "HEALTHCARE",
    assetType: "MODEL",
    euRiskLevel: "HIGH",
    autonomyLevel: "L2",
    businessFunction: "Healthcare",
    typicalDataTypes: ["Health", "PII", "Biometric"],
    applicableRegulations: ["EU_AI_ACT_MEDICAL", "FDA_SAMD", "HIPAA_AI", "GDPR_AI"],
    requiredControls: [
      "Risk management",
      "Data governance",
      "Human oversight",
      "Clinical validation"
    ],
    estimatedMaturity: 5,
    governanceComplexity: "HIGH",
    templateInputs: {
      assetType: "MODEL",
      description: "Medical image analysis for abnormality detection",
      businessFunction: "Healthcare",
      decisionsAffectingPeople: true,
      interactsWithEndUsers: false,
      deployment: "Global",
      verticals: ["HEALTHCARE"],
      autonomyLevel: "L2",
      dataTypes: ["Health", "PII", "Biometric"],
      euResidentsData: "Yes",
      expectedRiskLevel: "High",
      vulnerablePopulations: true
    }
  },
  {
    id: "hc-patient-risk",
    name: "Patient Risk Stratification",
    description:
      "Model that stratifies patients by risk level for care management and intervention prioritization.",
    vertical: "HEALTHCARE",
    assetType: "MODEL",
    euRiskLevel: "HIGH",
    autonomyLevel: "L2",
    businessFunction: "Healthcare",
    typicalDataTypes: ["Health", "PII"],
    applicableRegulations: ["EU_AI_ACT_MEDICAL", "HIPAA_AI", "GDPR_AI"],
    requiredControls: ["Risk management", "Data governance", "Human oversight"],
    estimatedMaturity: 4,
    governanceComplexity: "HIGH",
    templateInputs: {
      assetType: "MODEL",
      description: "Patient risk stratification for care management",
      businessFunction: "Healthcare",
      decisionsAffectingPeople: true,
      interactsWithEndUsers: false,
      deployment: "Global",
      verticals: ["HEALTHCARE"],
      autonomyLevel: "L2",
      dataTypes: ["Health", "PII"],
      euResidentsData: "Yes",
      expectedRiskLevel: "High",
      vulnerablePopulations: true
    }
  },
  {
    id: "hc-drug-interaction",
    name: "Drug Interaction Checker",
    description: "Application that checks for drug-drug and drug-allergy interactions.",
    vertical: "HEALTHCARE",
    assetType: "APPLICATION",
    euRiskLevel: "HIGH",
    autonomyLevel: "L1",
    businessFunction: "Healthcare",
    typicalDataTypes: ["Health", "PII"],
    applicableRegulations: ["EU_AI_ACT_MEDICAL", "FDA_SAMD", "HIPAA_AI"],
    requiredControls: ["Risk management", "Data governance", "Human oversight"],
    estimatedMaturity: 4,
    governanceComplexity: "MEDIUM",
    templateInputs: {
      assetType: "APPLICATION",
      description: "Drug interaction and allergy checking",
      businessFunction: "Healthcare",
      decisionsAffectingPeople: true,
      interactsWithEndUsers: true,
      deployment: "Global",
      verticals: ["HEALTHCARE"],
      autonomyLevel: "L1",
      dataTypes: ["Health", "PII"],
      euResidentsData: "Yes",
      expectedRiskLevel: "High",
      vulnerablePopulations: true
    }
  },
  // HR
  {
    id: "hr-resume-screening",
    name: "Resume Screening Tool",
    description:
      "AI tool that screens resumes and ranks candidates for hiring. Subject to NYC LL144 and EU AI Act employment provisions.",
    vertical: "HR",
    assetType: "APPLICATION",
    euRiskLevel: "HIGH",
    autonomyLevel: "L2",
    businessFunction: "HR",
    typicalDataTypes: ["Employment", "PII"],
    applicableRegulations: ["NYC_LL144", "EU_AI_ACT_EMPLOYMENT", "EEOC_AI", "IL_AEIA"],
    requiredControls: ["Bias audit", "Transparency", "Human review", "Data governance"],
    estimatedMaturity: 4,
    governanceComplexity: "HIGH",
    templateInputs: {
      assetType: "APPLICATION",
      description: "Resume screening and candidate ranking",
      businessFunction: "HR",
      decisionsAffectingPeople: true,
      interactsWithEndUsers: false,
      deployment: "Global",
      verticals: ["HR_SERVICES"],
      autonomyLevel: "L2",
      dataTypes: ["Employment", "PII"],
      euResidentsData: "Yes",
      expectedRiskLevel: "High",
      vulnerablePopulations: false
    }
  },
  {
    id: "hr-sentiment",
    name: "Employee Sentiment Analyzer",
    description:
      "Model that analyzes employee feedback and survey responses to gauge sentiment and engagement.",
    vertical: "HR",
    assetType: "MODEL",
    euRiskLevel: "LIMITED",
    autonomyLevel: "L1",
    businessFunction: "HR",
    typicalDataTypes: ["Employment", "PII"],
    applicableRegulations: ["EU_AI_ACT", "GDPR_AI"],
    requiredControls: ["Data governance", "Transparency", "Anonymization"],
    estimatedMaturity: 3,
    governanceComplexity: "MEDIUM",
    templateInputs: {
      assetType: "MODEL",
      description: "Employee sentiment and engagement analysis",
      businessFunction: "HR",
      decisionsAffectingPeople: false,
      interactsWithEndUsers: false,
      deployment: "Global",
      verticals: ["HR_SERVICES"],
      autonomyLevel: "L1",
      dataTypes: ["Employment", "PII"],
      euResidentsData: "Yes",
      expectedRiskLevel: "Medium",
      vulnerablePopulations: false
    }
  },
  {
    id: "hr-workforce-planning",
    name: "Workforce Planning Model",
    description: "Model that forecasts staffing needs and optimizes workforce allocation.",
    vertical: "HR",
    assetType: "MODEL",
    euRiskLevel: "MINIMAL",
    autonomyLevel: "L2",
    businessFunction: "HR",
    typicalDataTypes: ["Employment", "Proprietary"],
    applicableRegulations: ["EU_AI_ACT", "NIST_AI_RMF"],
    requiredControls: ["Risk management", "Data governance"],
    estimatedMaturity: 2,
    governanceComplexity: "LOW",
    templateInputs: {
      assetType: "MODEL",
      description: "Workforce planning and staffing forecasts",
      businessFunction: "HR",
      decisionsAffectingPeople: false,
      interactsWithEndUsers: false,
      deployment: "Global",
      verticals: ["HR_SERVICES"],
      autonomyLevel: "L2",
      dataTypes: ["Employment", "Proprietary"],
      euResidentsData: "Unknown",
      expectedRiskLevel: "Low",
      vulnerablePopulations: false
    }
  },
  // Retail
  {
    id: "retail-churn",
    name: "Customer Churn Predictor",
    description: "Model that predicts which customers are likely to churn for retention campaigns.",
    vertical: "RETAIL",
    assetType: "MODEL",
    euRiskLevel: "LIMITED",
    autonomyLevel: "L1",
    businessFunction: "Customer Service",
    typicalDataTypes: ["PII", "Proprietary"],
    applicableRegulations: ["EU_AI_ACT", "GDPR_AI"],
    requiredControls: ["Data governance", "Transparency"],
    estimatedMaturity: 3,
    governanceComplexity: "MEDIUM",
    templateInputs: {
      assetType: "MODEL",
      description: "Customer churn prediction for retention",
      businessFunction: "Customer Service",
      decisionsAffectingPeople: false,
      interactsWithEndUsers: false,
      deployment: "Global",
      verticals: ["GENERAL"],
      autonomyLevel: "L1",
      dataTypes: ["PII", "Proprietary"],
      euResidentsData: "Yes",
      expectedRiskLevel: "Medium",
      vulnerablePopulations: false
    }
  },
  {
    id: "retail-recommendations",
    name: "Product Recommendation Engine",
    description:
      "Recommendation system that suggests products based on browsing and purchase history.",
    vertical: "RETAIL",
    assetType: "APPLICATION",
    euRiskLevel: "LIMITED",
    autonomyLevel: "L2",
    businessFunction: "Customer Service",
    typicalDataTypes: ["PII", "Proprietary"],
    applicableRegulations: ["EU_AI_ACT", "GDPR_AI"],
    requiredControls: ["Transparency", "Data governance"],
    estimatedMaturity: 3,
    governanceComplexity: "MEDIUM",
    templateInputs: {
      assetType: "APPLICATION",
      description: "Product recommendations based on behavior",
      businessFunction: "Customer Service",
      decisionsAffectingPeople: false,
      interactsWithEndUsers: true,
      deployment: "Global",
      verticals: ["GENERAL"],
      autonomyLevel: "L2",
      dataTypes: ["PII", "Proprietary"],
      euResidentsData: "Yes",
      expectedRiskLevel: "Medium",
      vulnerablePopulations: false
    }
  },
  {
    id: "retail-dynamic-pricing",
    name: "Dynamic Pricing Model",
    description:
      "Model that adjusts prices in real time based on demand, inventory, and competitor data.",
    vertical: "RETAIL",
    assetType: "MODEL",
    euRiskLevel: "MINIMAL",
    autonomyLevel: "L4",
    businessFunction: "Operations",
    typicalDataTypes: ["Proprietary", "Public"],
    applicableRegulations: ["EU_AI_ACT", "NIST_AI_RMF"],
    requiredControls: ["Risk management", "Transparency"],
    estimatedMaturity: 2,
    governanceComplexity: "LOW",
    templateInputs: {
      assetType: "MODEL",
      description: "Dynamic pricing optimization",
      businessFunction: "Operations",
      decisionsAffectingPeople: false,
      interactsWithEndUsers: false,
      deployment: "Global",
      verticals: ["GENERAL"],
      autonomyLevel: "L4",
      dataTypes: ["Proprietary", "Public"],
      euResidentsData: "No",
      expectedRiskLevel: "Low",
      vulnerablePopulations: false
    }
  },
  {
    id: "retail-inventory-agent",
    name: "Inventory Reorder Agent",
    description: "Autonomous agent that monitors stock levels and triggers reorder requests.",
    vertical: "RETAIL",
    assetType: "AGENT",
    euRiskLevel: "MINIMAL",
    autonomyLevel: "L4",
    businessFunction: "Operations",
    typicalDataTypes: ["Proprietary"],
    applicableRegulations: ["EU_AI_ACT", "NIST_AI_RMF"],
    requiredControls: ["Risk management", "Audit trail"],
    estimatedMaturity: 2,
    governanceComplexity: "LOW",
    templateInputs: {
      assetType: "AGENT",
      description: "Autonomous inventory reorder agent",
      businessFunction: "Operations",
      decisionsAffectingPeople: false,
      interactsWithEndUsers: false,
      deployment: "Global",
      verticals: ["GENERAL"],
      autonomyLevel: "L4",
      dataTypes: ["Proprietary"],
      euResidentsData: "No",
      expectedRiskLevel: "Low",
      vulnerablePopulations: false
    }
  },
  // Customer Service
  {
    id: "cs-crm-chatbot",
    name: "CRM Chatbot",
    description: "Customer-facing chatbot integrated with CRM for support and sales assistance.",
    vertical: "CUSTOMER_SERVICE",
    assetType: "APPLICATION",
    euRiskLevel: "LIMITED",
    autonomyLevel: "L3",
    businessFunction: "Customer Service",
    typicalDataTypes: ["PII", "Proprietary"],
    applicableRegulations: ["EU_AI_ACT", "GDPR_AI"],
    requiredControls: ["Transparency", "Human escalation", "Data governance"],
    estimatedMaturity: 3,
    governanceComplexity: "MEDIUM",
    templateInputs: {
      assetType: "APPLICATION",
      description: "CRM-integrated customer support chatbot",
      businessFunction: "Customer Service",
      decisionsAffectingPeople: false,
      interactsWithEndUsers: true,
      deployment: "Global",
      verticals: ["GENERAL"],
      autonomyLevel: "L3",
      dataTypes: ["PII", "Proprietary"],
      euResidentsData: "Yes",
      expectedRiskLevel: "Medium",
      vulnerablePopulations: false
    }
  },
  {
    id: "cs-ticket-classification",
    name: "Ticket Classification Agent",
    description:
      "Agent that automatically classifies and routes support tickets to the right team.",
    vertical: "CUSTOMER_SERVICE",
    assetType: "AGENT",
    euRiskLevel: "LIMITED",
    autonomyLevel: "L3",
    businessFunction: "Customer Service",
    typicalDataTypes: ["PII", "Proprietary"],
    applicableRegulations: ["EU_AI_ACT", "GDPR_AI"],
    requiredControls: ["Transparency", "Data governance"],
    estimatedMaturity: 3,
    governanceComplexity: "MEDIUM",
    templateInputs: {
      assetType: "AGENT",
      description: "Support ticket classification and routing",
      businessFunction: "Customer Service",
      decisionsAffectingPeople: false,
      interactsWithEndUsers: false,
      deployment: "Global",
      verticals: ["GENERAL"],
      autonomyLevel: "L3",
      dataTypes: ["PII", "Proprietary"],
      euResidentsData: "Yes",
      expectedRiskLevel: "Medium",
      vulnerablePopulations: false
    }
  },
  {
    id: "cs-sentiment-pipeline",
    name: "Sentiment Analysis Pipeline",
    description:
      "Pipeline that processes customer feedback and social media for sentiment insights.",
    vertical: "CUSTOMER_SERVICE",
    assetType: "PIPELINE",
    euRiskLevel: "LIMITED",
    autonomyLevel: "L2",
    businessFunction: "Customer Service",
    typicalDataTypes: ["PII", "Proprietary", "Public"],
    applicableRegulations: ["EU_AI_ACT", "GDPR_AI"],
    requiredControls: ["Data governance", "Transparency"],
    estimatedMaturity: 3,
    governanceComplexity: "MEDIUM",
    templateInputs: {
      assetType: "PIPELINE",
      description: "Customer sentiment analysis pipeline",
      businessFunction: "Customer Service",
      decisionsAffectingPeople: false,
      interactsWithEndUsers: false,
      deployment: "Global",
      verticals: ["GENERAL"],
      autonomyLevel: "L2",
      dataTypes: ["PII", "Proprietary", "Public"],
      euResidentsData: "Yes",
      expectedRiskLevel: "Medium",
      vulnerablePopulations: false
    }
  }
];

export function getUseCaseById(id: string): UseCase | undefined {
  return USE_CASES.find((u) => u.id === id);
}
