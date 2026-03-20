/**
 * Enterprise demo seed – Meridian Industrial Group.
 * Manufacturing + retail, 12 users, 32 AI assets, accountability, risks.
 * Run AFTER demo.ts so Acme Corp is preserved.
 */
import type { PrismaClient } from "@prisma/client";

const ORG = {
  name: "Meridian Industrial Group",
  slug: "meridian-industrial",
  verticalMarket: "GENERAL" as const,
  plan: "ENTERPRISE" as const,
  claimedDomain: "meridian-industrial.com"
};

type Persona =
  | "CEO"
  | "CFO"
  | "COO"
  | "CISO"
  | "LEGAL"
  | "CAIO"
  | "DATA_OWNER"
  | "DEV_LEAD"
  | "PLATFORM_ENG"
  | "VENDOR_MGR";

const USERS: Array<{
  email: string;
  role: "CAIO" | "ADMIN" | "ANALYST" | "VIEWER" | "AUDITOR";
  persona: Persona;
}> = [
  { email: "sarah.chen@meridian-industrial.com", role: "CAIO", persona: "CAIO" },
  { email: "james.okonkwo@meridian-industrial.com", role: "ADMIN", persona: "CISO" },
  { email: "priya.patel@meridian-industrial.com", role: "ANALYST", persona: "CFO" },
  { email: "marco.rossi@meridian-industrial.com", role: "ANALYST", persona: "PLATFORM_ENG" },
  { email: "lisa.wang@meridian-industrial.com", role: "ANALYST", persona: "COO" },
  { email: "david.kim@meridian-industrial.com", role: "VIEWER", persona: "DEV_LEAD" },
  { email: "anna.schmidt@meridian-industrial.com", role: "VIEWER", persona: "LEGAL" },
  { email: "carlos.mendez@meridian-industrial.com", role: "VIEWER", persona: "VENDOR_MGR" },
  { email: "rachel.obi@meridian-industrial.com", role: "AUDITOR", persona: "DEV_LEAD" },
  { email: "tom.bradley@meridian-industrial.com", role: "VIEWER", persona: "CEO" },
  { email: "nina.volkov@meridian-industrial.com", role: "ANALYST", persona: "DATA_OWNER" },
  { email: "alex.foster@meridian-industrial.com", role: "VIEWER", persona: "PLATFORM_ENG" }
];

type AssetInput = {
  name: string;
  description: string;
  assetType: "MODEL" | "AGENT" | "APPLICATION";
  euRiskLevel: "MINIMAL" | "LIMITED" | "HIGH";
  cosaiLayer:
    | "LAYER_1_BUSINESS"
    | "LAYER_2_INFORMATION"
    | "LAYER_3_APPLICATION"
    | "LAYER_4_PLATFORM"
    | "LAYER_5_SUPPLY_CHAIN";
  autonomyLevel: "ASSISTED" | "SEMI_AUTONOMOUS" | "AUTONOMOUS";
  ownerEmail: string;
  overrideTier?: "T1" | "T2" | "T3" | "T4" | "T5";
  toolAuthorizations?: string[];
  lifecycleStage?: string;
  humanOversightRequired?: boolean;
};

const ASSETS: AssetInput[] = [
  // Manufacturing Operations (8)
  {
    name: "Predictive Maintenance AI",
    description: "ML model predicting equipment failures from sensor data",
    assetType: "MODEL",
    euRiskLevel: "LIMITED",
    cosaiLayer: "LAYER_4_PLATFORM",
    autonomyLevel: "SEMI_AUTONOMOUS",
    ownerEmail: "david.kim@meridian-industrial.com"
  },
  {
    name: "Quality Inspection Vision System",
    description: "Computer vision for defect detection on production line",
    assetType: "MODEL",
    euRiskLevel: "HIGH",
    cosaiLayer: "LAYER_3_APPLICATION",
    autonomyLevel: "SEMI_AUTONOMOUS",
    ownerEmail: "david.kim@meridian-industrial.com",
    overrideTier: "T3",
    lifecycleStage: "PRODUCTION",
    humanOversightRequired: true
  },
  {
    name: "Production Schedule Optimizer",
    description: "Optimizes production sequencing and resource allocation",
    assetType: "MODEL",
    euRiskLevel: "LIMITED",
    cosaiLayer: "LAYER_3_APPLICATION",
    autonomyLevel: "AUTONOMOUS",
    ownerEmail: "david.kim@meridian-industrial.com",
    overrideTier: "T2",
    toolAuthorizations: ["mes-api", "scheduling-service"],
    lifecycleStage: "PRODUCTION"
  },
  {
    name: "Equipment Failure Predictor",
    description: "Predicts machinery breakdowns for preventive maintenance",
    assetType: "MODEL",
    euRiskLevel: "LIMITED",
    cosaiLayer: "LAYER_4_PLATFORM",
    autonomyLevel: "SEMI_AUTONOMOUS",
    ownerEmail: "david.kim@meridian-industrial.com"
  },
  {
    name: "Energy Consumption Optimizer",
    description: "AI-driven energy usage optimization across facilities",
    assetType: "MODEL",
    euRiskLevel: "MINIMAL",
    cosaiLayer: "LAYER_4_PLATFORM",
    autonomyLevel: "SEMI_AUTONOMOUS",
    ownerEmail: "david.kim@meridian-industrial.com"
  },
  {
    name: "Supply Chain Demand Forecaster",
    description: "Forecasts demand for inventory planning",
    assetType: "MODEL",
    euRiskLevel: "LIMITED",
    cosaiLayer: "LAYER_3_APPLICATION",
    autonomyLevel: "SEMI_AUTONOMOUS",
    ownerEmail: "lisa.wang@meridian-industrial.com"
  },
  {
    name: "Inventory Reorder Agent",
    description: "Autonomous agent for inventory replenishment decisions",
    assetType: "AGENT",
    euRiskLevel: "LIMITED",
    cosaiLayer: "LAYER_3_APPLICATION",
    autonomyLevel: "AUTONOMOUS",
    ownerEmail: "lisa.wang@meridian-industrial.com",
    overrideTier: "T3",
    toolAuthorizations: ["erp-api", "supplier-portal", "inventory-db"],
    lifecycleStage: "PRODUCTION",
    humanOversightRequired: true
  },
  {
    name: "Supplier Risk Scorer",
    description: "Scores supplier risk based on financial and operational data",
    assetType: "MODEL",
    euRiskLevel: "LIMITED",
    cosaiLayer: "LAYER_5_SUPPLY_CHAIN",
    autonomyLevel: "ASSISTED",
    ownerEmail: "lisa.wang@meridian-industrial.com"
  },
  // Retail Division (7)
  {
    name: "Customer Churn Predictor",
    description: "Predicts customer churn for retention campaigns",
    assetType: "MODEL",
    euRiskLevel: "LIMITED",
    cosaiLayer: "LAYER_3_APPLICATION",
    autonomyLevel: "ASSISTED",
    ownerEmail: "tom.bradley@meridian-industrial.com"
  },
  {
    name: "Product Recommendation Engine",
    description: "Personalized product recommendations for e-commerce",
    assetType: "MODEL",
    euRiskLevel: "MINIMAL",
    cosaiLayer: "LAYER_3_APPLICATION",
    autonomyLevel: "ASSISTED",
    ownerEmail: "tom.bradley@meridian-industrial.com"
  },
  {
    name: "Dynamic Pricing Model",
    description: "Real-time pricing optimization based on demand and competition",
    assetType: "MODEL",
    euRiskLevel: "HIGH",
    cosaiLayer: "LAYER_3_APPLICATION",
    autonomyLevel: "SEMI_AUTONOMOUS",
    ownerEmail: "tom.bradley@meridian-industrial.com"
  },
  {
    name: "Customer Sentiment Analyzer",
    description: "Analyzes customer feedback and reviews",
    assetType: "MODEL",
    euRiskLevel: "MINIMAL",
    cosaiLayer: "LAYER_2_INFORMATION",
    autonomyLevel: "ASSISTED",
    ownerEmail: "tom.bradley@meridian-industrial.com"
  },
  {
    name: "Fraud Detection System",
    description: "Detects fraudulent transactions in real time",
    assetType: "MODEL",
    euRiskLevel: "HIGH",
    cosaiLayer: "LAYER_3_APPLICATION",
    autonomyLevel: "SEMI_AUTONOMOUS",
    ownerEmail: "carlos.mendez@meridian-industrial.com"
  },
  {
    name: "Returns Classification Agent",
    description: "Classifies return reasons for process optimization",
    assetType: "AGENT",
    euRiskLevel: "LIMITED",
    cosaiLayer: "LAYER_3_APPLICATION",
    autonomyLevel: "SEMI_AUTONOMOUS",
    ownerEmail: "tom.bradley@meridian-industrial.com"
  },
  {
    name: "Store Layout Optimizer",
    description: "Recommends optimal product placement in stores",
    assetType: "MODEL",
    euRiskLevel: "MINIMAL",
    cosaiLayer: "LAYER_1_BUSINESS",
    autonomyLevel: "ASSISTED",
    ownerEmail: "tom.bradley@meridian-industrial.com"
  },
  // HR & People (5)
  {
    name: "CV Screening Assistant",
    description: "AI-assisted resume screening (EU AI Act Annex III — employment)",
    assetType: "MODEL",
    euRiskLevel: "HIGH",
    cosaiLayer: "LAYER_3_APPLICATION",
    autonomyLevel: "SEMI_AUTONOMOUS",
    ownerEmail: "anna.schmidt@meridian-industrial.com"
  },
  {
    name: "Employee Sentiment Monitor",
    description: "Monitors employee sentiment (EU AI Act Annex III — worker monitoring)",
    assetType: "MODEL",
    euRiskLevel: "HIGH",
    cosaiLayer: "LAYER_2_INFORMATION",
    autonomyLevel: "ASSISTED",
    ownerEmail: "anna.schmidt@meridian-industrial.com"
  },
  {
    name: "Training Recommendation Engine",
    description: "Recommends training based on skills gaps",
    assetType: "MODEL",
    euRiskLevel: "LIMITED",
    cosaiLayer: "LAYER_3_APPLICATION",
    autonomyLevel: "ASSISTED",
    ownerEmail: "anna.schmidt@meridian-industrial.com"
  },
  {
    name: "Workforce Planning Forecaster",
    description: "Forecasts workforce needs by department",
    assetType: "MODEL",
    euRiskLevel: "LIMITED",
    cosaiLayer: "LAYER_3_APPLICATION",
    autonomyLevel: "ASSISTED",
    ownerEmail: "anna.schmidt@meridian-industrial.com"
  },
  {
    name: "Payroll Anomaly Detector",
    description: "Detects anomalies in payroll data",
    assetType: "MODEL",
    euRiskLevel: "LIMITED",
    cosaiLayer: "LAYER_3_APPLICATION",
    autonomyLevel: "SEMI_AUTONOMOUS",
    ownerEmail: "carlos.mendez@meridian-industrial.com"
  },
  // Finance (4)
  {
    name: "Accounts Payable Automation",
    description: "Agent for invoice processing and approval routing",
    assetType: "AGENT",
    euRiskLevel: "LIMITED",
    cosaiLayer: "LAYER_3_APPLICATION",
    autonomyLevel: "SEMI_AUTONOMOUS",
    ownerEmail: "carlos.mendez@meridian-industrial.com",
    overrideTier: "T2",
    toolAuthorizations: ["erp-api", "vendor-portal"],
    lifecycleStage: "PRODUCTION"
  },
  {
    name: "Cash Flow Predictor",
    description: "Predicts cash flow for treasury management",
    assetType: "MODEL",
    euRiskLevel: "LIMITED",
    cosaiLayer: "LAYER_3_APPLICATION",
    autonomyLevel: "ASSISTED",
    ownerEmail: "carlos.mendez@meridian-industrial.com"
  },
  {
    name: "Audit Risk Scorer",
    description: "Scores audit risk for financial controls",
    assetType: "MODEL",
    euRiskLevel: "HIGH",
    cosaiLayer: "LAYER_3_APPLICATION",
    autonomyLevel: "ASSISTED",
    ownerEmail: "rachel.obi@meridian-industrial.com"
  },
  {
    name: "Contract Analysis Assistant",
    description: "Extracts key terms from contracts",
    assetType: "MODEL",
    euRiskLevel: "LIMITED",
    cosaiLayer: "LAYER_3_APPLICATION",
    autonomyLevel: "ASSISTED",
    ownerEmail: "alex.foster@meridian-industrial.com"
  },
  // IT & Security (4)
  {
    name: "Network Anomaly Detector",
    description: "Detects anomalous network traffic patterns",
    assetType: "MODEL",
    euRiskLevel: "LIMITED",
    cosaiLayer: "LAYER_4_PLATFORM",
    autonomyLevel: "SEMI_AUTONOMOUS",
    ownerEmail: "marco.rossi@meridian-industrial.com"
  },
  {
    name: "IT Helpdesk Chatbot",
    description: "Chatbot for tier-1 IT support",
    assetType: "APPLICATION",
    euRiskLevel: "MINIMAL",
    cosaiLayer: "LAYER_3_APPLICATION",
    autonomyLevel: "ASSISTED",
    ownerEmail: "marco.rossi@meridian-industrial.com"
  },
  {
    name: "Vulnerability Prioritizer",
    description: "Prioritizes vulnerabilities for remediation",
    assetType: "MODEL",
    euRiskLevel: "LIMITED",
    cosaiLayer: "LAYER_3_APPLICATION",
    autonomyLevel: "ASSISTED",
    ownerEmail: "marco.rossi@meridian-industrial.com"
  },
  {
    name: "Log Analysis Agent",
    description: "Autonomous agent for security log analysis",
    assetType: "AGENT",
    euRiskLevel: "LIMITED",
    cosaiLayer: "LAYER_4_PLATFORM",
    autonomyLevel: "AUTONOMOUS",
    ownerEmail: "marco.rossi@meridian-industrial.com",
    overrideTier: "T4",
    toolAuthorizations: ["siem-api", "splunk", "pagerduty"],
    lifecycleStage: "PRODUCTION",
    humanOversightRequired: true
  },
  // Corporate (4)
  {
    name: "Board Report Generator",
    description: "Generates executive summaries for board reports",
    assetType: "APPLICATION",
    euRiskLevel: "MINIMAL",
    cosaiLayer: "LAYER_1_BUSINESS",
    autonomyLevel: "ASSISTED",
    ownerEmail: "sarah.chen@meridian-industrial.com"
  },
  {
    name: "Regulatory Change Monitor",
    description: "Monitors regulatory changes affecting the business",
    assetType: "MODEL",
    euRiskLevel: "LIMITED",
    cosaiLayer: "LAYER_1_BUSINESS",
    autonomyLevel: "ASSISTED",
    ownerEmail: "priya.patel@meridian-industrial.com"
  },
  {
    name: "ESG Reporting Assistant",
    description: "Assists with ESG data collection and reporting",
    assetType: "MODEL",
    euRiskLevel: "LIMITED",
    cosaiLayer: "LAYER_1_BUSINESS",
    autonomyLevel: "ASSISTED",
    ownerEmail: "sarah.chen@meridian-industrial.com"
  },
  {
    name: "Legal Document Summarizer",
    description: "Summarizes legal documents for review",
    assetType: "MODEL",
    euRiskLevel: "LIMITED",
    cosaiLayer: "LAYER_3_APPLICATION",
    autonomyLevel: "ASSISTED",
    ownerEmail: "alex.foster@meridian-industrial.com"
  }
];

const HIGH_RISK_ASSET_NAMES = [
  "Quality Inspection Vision System",
  "Dynamic Pricing Model",
  "Fraud Detection System",
  "CV Screening Assistant",
  "Employee Sentiment Monitor",
  "Audit Risk Scorer"
];

const RISKS: Array<{
  assetName: string;
  title: string;
  description?: string;
  likelihood: number;
  impact: number;
  cosaiLayer:
    | "LAYER_1_BUSINESS"
    | "LAYER_2_INFORMATION"
    | "LAYER_3_APPLICATION"
    | "LAYER_4_PLATFORM"
    | "LAYER_5_SUPPLY_CHAIN";
}> = [
  {
    assetName: "CV Screening Assistant",
    title: "CV screening model exhibits demographic bias in filtering",
    likelihood: 5,
    impact: 5,
    cosaiLayer: "LAYER_3_APPLICATION"
  },
  {
    assetName: "Dynamic Pricing Model",
    title: "Dynamic pricing model lacks explainability documentation",
    likelihood: 4,
    impact: 4,
    cosaiLayer: "LAYER_3_APPLICATION"
  },
  {
    assetName: "Fraud Detection System",
    title: "Fraud detection system has no documented appeal process",
    likelihood: 4,
    impact: 5,
    cosaiLayer: "LAYER_3_APPLICATION"
  },
  {
    assetName: "Quality Inspection Vision System",
    title: "Vision system may misclassify defects under low-light conditions",
    likelihood: 4,
    impact: 4,
    cosaiLayer: "LAYER_3_APPLICATION"
  },
  {
    assetName: "Employee Sentiment Monitor",
    title: "Employee sentiment monitor collects data without explicit consent",
    likelihood: 5,
    impact: 4,
    cosaiLayer: "LAYER_2_INFORMATION"
  },
  {
    assetName: "Inventory Reorder Agent",
    title: "Inventory agent may execute purchases without human review",
    likelihood: 3,
    impact: 4,
    cosaiLayer: "LAYER_3_APPLICATION"
  },
  {
    assetName: "Production Schedule Optimizer",
    title: "Schedule optimizer may prioritize cost over safety constraints",
    likelihood: 2,
    impact: 4,
    cosaiLayer: "LAYER_3_APPLICATION"
  },
  {
    assetName: "Supply Chain Demand Forecaster",
    title: "Demand forecaster lacks validation for new product launches",
    likelihood: 3,
    impact: 3,
    cosaiLayer: "LAYER_3_APPLICATION"
  },
  {
    assetName: "Accounts Payable Automation",
    title: "AP agent may approve invoices from unverified vendors",
    likelihood: 2,
    impact: 4,
    cosaiLayer: "LAYER_3_APPLICATION"
  },
  {
    assetName: "Log Analysis Agent",
    title: "Log agent may miss critical security events in high-volume environments",
    likelihood: 3,
    impact: 3,
    cosaiLayer: "LAYER_4_PLATFORM"
  },
  {
    assetName: "Supplier Risk Scorer",
    title: "Supplier scorer relies on incomplete third-party data",
    likelihood: 3,
    impact: 3,
    cosaiLayer: "LAYER_5_SUPPLY_CHAIN"
  },
  {
    assetName: "Product Recommendation Engine",
    title: "Recommendation engine may create filter bubbles",
    likelihood: 2,
    impact: 2,
    cosaiLayer: "LAYER_3_APPLICATION"
  },
  {
    assetName: "IT Helpdesk Chatbot",
    title: "Chatbot may provide incorrect troubleshooting steps",
    likelihood: 2,
    impact: 1,
    cosaiLayer: "LAYER_3_APPLICATION"
  },
  {
    assetName: "Energy Consumption Optimizer",
    title: "Optimizer may conflict with production priorities",
    likelihood: 1,
    impact: 2,
    cosaiLayer: "LAYER_4_PLATFORM"
  },
  {
    assetName: "Store Layout Optimizer",
    title: "Layout recommendations may not account for accessibility",
    likelihood: 1,
    impact: 1,
    cosaiLayer: "LAYER_1_BUSINESS"
  }
];

export async function seedDemoEnterprise(prisma: PrismaClient): Promise<void> {
  const existing = await prisma.organization.findUnique({
    where: { slug: ORG.slug }
  });

  const org = existing
    ? await prisma.organization.update({
        where: { slug: ORG.slug },
        data: {
          name: ORG.name,
          verticalMarket: ORG.verticalMarket,
          plan: ORG.plan,
          tier: "PRO",
          assetLimit: 500,
          usersLimit: 25,
          claimedDomain: ORG.claimedDomain,
          clientVerticals: [
            "GENERAL",
            "FINANCIAL_SERVICES",
            "HEALTHCARE",
            "INSURANCE",
            "PUBLIC_SECTOR"
          ] as object
        }
      })
    : await prisma.organization.create({
        data: {
          name: ORG.name,
          slug: ORG.slug,
          verticalMarket: ORG.verticalMarket,
          plan: ORG.plan,
          tier: "PRO",
          assetLimit: 500,
          usersLimit: 25,
          claimedDomain: ORG.claimedDomain,
          clientVerticals: [
            "GENERAL",
            "FINANCIAL_SERVICES",
            "HEALTHCARE",
            "INSURANCE",
            "PUBLIC_SECTOR"
          ] as object
        }
      });

  const userMap = new Map<string, string>();
  for (const u of USERS) {
    const user = await prisma.user.upsert({
      where: { orgId_email: { orgId: org.id, email: u.email } },
      create: {
        orgId: org.id,
        email: u.email,
        role: u.role,
        persona: u.persona,
        mfaEnabled: u.role === "ADMIN" || u.role === "CAIO"
      },
      update: { role: u.role, persona: u.persona }
    });
    userMap.set(u.email, user.id);
  }

  const nameToOwnerId = (email: string) => userMap.get(email) ?? null;

  const ASSET_CLIENT_VERTICALS: Record<string, string> = {
    "CV Screening Assistant": "HR_SERVICES",
    "Fraud Detection System": "FINANCIAL_SERVICES",
    "Audit Risk Scorer": "FINANCIAL_SERVICES",
    "Dynamic Pricing Model": "GENERAL",
    "Customer Churn Predictor": "FINANCIAL_SERVICES",
    "Network Anomaly Detector": "PUBLIC_SECTOR"
  };

  const assetIdsByName = new Map<string, string>();
  for (const a of ASSETS) {
    const ownerId = nameToOwnerId(a.ownerEmail);
    const existing = await prisma.aIAsset.findFirst({
      where: { orgId: org.id, name: a.name, deletedAt: null }
    });
    const clientVertical = ASSET_CLIENT_VERTICALS[a.name] ?? null;
    const extraData = {
      ...(a.overrideTier && { overrideTier: a.overrideTier }),
      ...(a.toolAuthorizations && { toolAuthorizations: a.toolAuthorizations }),
      ...(a.lifecycleStage && { lifecycleStage: a.lifecycleStage }),
      ...(a.humanOversightRequired !== undefined && {
        humanOversightRequired: a.humanOversightRequired
      })
    };
    const asset = existing
      ? await prisma.aIAsset.update({
          where: { id: existing.id },
          data: {
            description: a.description,
            euRiskLevel: a.euRiskLevel,
            cosaiLayer: a.cosaiLayer,
            autonomyLevel: a.autonomyLevel,
            ownerId,
            clientVertical,
            ...extraData
          }
        })
      : await prisma.aIAsset.create({
          data: {
            orgId: org.id,
            name: a.name,
            description: a.description,
            assetType: a.assetType,
            euRiskLevel: a.euRiskLevel,
            cosaiLayer: a.cosaiLayer,
            autonomyLevel: a.autonomyLevel,
            verticalMarket: "GENERAL",
            status: "ACTIVE",
            ownerId,
            clientVertical,
            ...extraData
          }
        });
    assetIdsByName.set(a.name, asset.id);
  }

  const ownerNames: Record<string, string> = {
    "david.kim@meridian-industrial.com": "David Kim",
    "lisa.wang@meridian-industrial.com": "Lisa Wang",
    "tom.bradley@meridian-industrial.com": "Tom Bradley",
    "carlos.mendez@meridian-industrial.com": "Carlos Mendez",
    "anna.schmidt@meridian-industrial.com": "Anna Schmidt",
    "rachel.obi@meridian-industrial.com": "Rachel Obi",
    "alex.foster@meridian-industrial.com": "Alex Foster",
    "marco.rossi@meridian-industrial.com": "Marco Rossi",
    "sarah.chen@meridian-industrial.com": "Sarah Chen",
    "priya.patel@meridian-industrial.com": "Priya Patel"
  };

  for (const assetName of HIGH_RISK_ASSET_NAMES) {
    const assetId = assetIdsByName.get(assetName);
    if (!assetId) continue;

    const asset = ASSETS.find((a) => a.name === assetName);
    const ownerName = asset ? (ownerNames[asset.ownerEmail] ?? "Asset Owner") : "Asset Owner";

    const assignments = [
      {
        assetId,
        componentName: "AI System",
        cosaiLayer: "LAYER_3_APPLICATION" as const,
        accountableParty: `AI Application Developer (${ownerName})`,
        responsibleParty: "IT Security"
      },
      {
        assetId,
        componentName: "Training Data",
        cosaiLayer: "LAYER_2_INFORMATION" as const,
        accountableParty: "Data Owner (Nina Volkov)",
        responsibleParty: "Compliance Team"
      },
      {
        assetId,
        componentName: "Model Provider",
        cosaiLayer: "LAYER_5_SUPPLY_CHAIN" as const,
        accountableParty: "Vendor/Provider",
        responsibleParty: "Supply Chain (Lisa Wang)"
      }
    ];

    for (const aa of assignments) {
      await prisma.accountabilityAssignment.upsert({
        where: {
          assetId_componentName_cosaiLayer: {
            assetId: aa.assetId,
            componentName: aa.componentName,
            cosaiLayer: aa.cosaiLayer
          }
        },
        create: aa,
        update: {
          accountableParty: aa.accountableParty,
          responsibleParty: aa.responsibleParty
        }
      });
    }
  }

  for (const r of RISKS) {
    const assetId = assetIdsByName.get(r.assetName);
    if (!assetId) continue;

    const riskScore = (r.likelihood * r.impact) / 5;

    const existing = await prisma.riskRegister.findFirst({
      where: { orgId: org.id, assetId, title: r.title }
    });

    if (!existing) {
      await prisma.riskRegister.create({
        data: {
          orgId: org.id,
          assetId,
          title: r.title,
          description: r.description,
          likelihood: r.likelihood,
          impact: r.impact,
          riskScore,
          cosaiLayer: r.cosaiLayer,
          status: "IDENTIFIED"
        }
      });
    }
  }

  // eslint-disable-next-line no-console
  console.log(
    `Meridian Industrial Group seeded: ${USERS.length} users, ${ASSETS.length} assets, ${HIGH_RISK_ASSET_NAMES.length} accountability sets, ${RISKS.length} risks.`
  );
}
