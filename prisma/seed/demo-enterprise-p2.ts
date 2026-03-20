/**
 * Meridian Industrial demo seed – Part 2.
 * Artifact cards, vendor assurance records, scan records.
 * Run AFTER demo-enterprise.ts. Uses Meridian Industrial orgId.
 */
import type { PrismaClient } from "@prisma/client";

const ORG_SLUG = "meridian-industrial";

const ARTIFACT_CARDS: Array<{
  modelName: string;
  sourceFormat: "REPO" | "MANUAL" | "API" | "IMPORT";
  normalizedContent: Record<string, unknown>;
  linkedAssets: string[];
}> = [
  {
    modelName: "GPT-4o",
    sourceFormat: "API",
    normalizedContent: {
      modelName: "GPT-4o",
      organization: "OpenAI",
      version: "gpt-4o-2024-08-06",
      intendedUse: "General enterprise text tasks",
      contextWindow: 128000,
      license: "Commercial API",
      knownLimitations: ["May hallucinate citations", "Training cutoff"],
      euAiActRiskLevel: "MINIMAL",
      benchmarks: { MMLU: 88.7, HumanEval: 90.2 }
    },
    linkedAssets: [
      "IT Helpdesk Chatbot",
      "Board Report Generator",
      "Legal Document Summarizer",
      "Contract Analysis Assistant"
    ]
  },
  {
    modelName: "Claude Sonnet 4",
    sourceFormat: "API",
    normalizedContent: {
      modelName: "Claude Sonnet 4",
      organization: "Anthropic",
      intendedUse: "Enterprise reasoning and analysis",
      contextWindow: 200000,
      license: "Commercial API",
      knownLimitations: ["Knowledge cutoff", "No real-time data"],
      euAiActRiskLevel: "MINIMAL",
      benchmarks: { MMLU: 90.1, HumanEval: 92.3 }
    },
    linkedAssets: [
      "CV Screening Assistant",
      "Employee Sentiment Monitor",
      "Regulatory Change Monitor",
      "ESG Reporting Assistant"
    ]
  },
  {
    modelName: "Llama 4 Scout",
    sourceFormat: "REPO",
    normalizedContent: {
      modelName: "Llama 4 Scout",
      organization: "Meta",
      intendedUse: "On-premise security workloads",
      contextWindow: 10000000,
      license: "Llama 4 Community License",
      knownLimitations: ["Requires fine-tuning for domain tasks"],
      euAiActRiskLevel: "MINIMAL",
      benchmarks: { MMLU: 79.2 }
    },
    linkedAssets: ["Network Anomaly Detector", "Log Analysis Agent", "Vulnerability Prioritizer"]
  },
  {
    modelName: "Meridian-QualityVision-v2.1",
    sourceFormat: "MANUAL",
    normalizedContent: {
      modelName: "Meridian-QualityVision-v2.1",
      organization: "Meridian Industrial (internal)",
      intendedUse: "Manufacturing quality defect detection",
      trainingData: "48 months proprietary sensor and camera data",
      evaluations: ["99.2% precision on test set", "0.3% false negative rate"],
      knownLimitations: ["Trained on Facility A only", "Seasonal variance not modeled"],
      euAiActRiskLevel: "HIGH"
    },
    linkedAssets: ["Quality Inspection Vision System", "Predictive Maintenance AI"]
  },
  {
    modelName: "Meridian-FraudDetect-v1.4",
    sourceFormat: "MANUAL",
    normalizedContent: {
      modelName: "Meridian-FraudDetect-v1.4",
      organization: "Meridian Industrial (internal)",
      intendedUse: "Retail transaction fraud detection",
      trainingData: "36 months transaction history",
      evaluations: ["94.1% AUC-ROC", "False positive rate 2.3%"],
      knownLimitations: ["New fraud patterns may not be detected"],
      euAiActRiskLevel: "HIGH"
    },
    linkedAssets: ["Fraud Detection System"]
  }
];

const VENDORS: Array<{
  vendorName: string;
  vendorType: "MODEL_PROVIDER" | "DATA_PROVIDER" | "INFRASTRUCTURE" | "TOOLING" | "OTHER";
  cosaiLayer: "LAYER_3_APPLICATION" | "LAYER_4_PLATFORM" | "LAYER_5_SUPPLY_CHAIN";
  soc2Status: "NOT_APPLICABLE" | "IN_PROGRESS" | "CERTIFIED" | "EXPIRED";
  soc2ExpiresAt?: Date;
  iso27001Status: "NOT_APPLICABLE" | "IN_PROGRESS" | "CERTIFIED" | "EXPIRED";
  slsaLevel: "L0" | "L1" | "L2" | "L3" | "L4";
  modelCardAvailable: boolean;
  contractAligned: boolean;
  lastReviewedAt: Date;
  evidenceLinks?: Record<string, unknown>;
}> = [
  {
    vendorName: "OpenAI",
    vendorType: "MODEL_PROVIDER",
    cosaiLayer: "LAYER_5_SUPPLY_CHAIN",
    soc2Status: "CERTIFIED",
    soc2ExpiresAt: new Date("2026-09-30"),
    iso27001Status: "CERTIFIED",
    slsaLevel: "L2",
    modelCardAvailable: true,
    contractAligned: true,
    lastReviewedAt: new Date("2026-01-15")
  },
  {
    vendorName: "Anthropic",
    vendorType: "MODEL_PROVIDER",
    cosaiLayer: "LAYER_5_SUPPLY_CHAIN",
    soc2Status: "CERTIFIED",
    soc2ExpiresAt: new Date("2026-11-30"),
    iso27001Status: "IN_PROGRESS",
    slsaLevel: "L2",
    modelCardAvailable: true,
    contractAligned: true,
    lastReviewedAt: new Date("2026-01-20")
  },
  {
    vendorName: "Microsoft Azure AI",
    vendorType: "INFRASTRUCTURE",
    cosaiLayer: "LAYER_4_PLATFORM",
    soc2Status: "CERTIFIED",
    soc2ExpiresAt: new Date("2026-06-30"),
    iso27001Status: "CERTIFIED",
    slsaLevel: "L3",
    modelCardAvailable: true,
    contractAligned: true,
    lastReviewedAt: new Date("2026-02-01")
  },
  {
    vendorName: "Meta (Llama Models)",
    vendorType: "MODEL_PROVIDER",
    cosaiLayer: "LAYER_5_SUPPLY_CHAIN",
    soc2Status: "NOT_APPLICABLE",
    iso27001Status: "NOT_APPLICABLE",
    slsaLevel: "L1",
    modelCardAvailable: true,
    contractAligned: false,
    lastReviewedAt: new Date("2026-01-10"),
    evidenceLinks: {
      notes:
        "Open source — contract alignment not applicable, but license compliance review pending"
    }
  },
  {
    vendorName: "Hugging Face",
    vendorType: "MODEL_PROVIDER",
    cosaiLayer: "LAYER_5_SUPPLY_CHAIN",
    soc2Status: "EXPIRED",
    soc2ExpiresAt: new Date("2025-12-31"),
    iso27001Status: "NOT_APPLICABLE",
    slsaLevel: "L1",
    modelCardAvailable: true,
    contractAligned: false,
    lastReviewedAt: new Date("2025-11-15")
  },
  {
    vendorName: "Salesforce Einstein",
    vendorType: "OTHER",
    cosaiLayer: "LAYER_3_APPLICATION",
    soc2Status: "CERTIFIED",
    soc2ExpiresAt: new Date("2026-08-31"),
    iso27001Status: "CERTIFIED",
    slsaLevel: "L2",
    modelCardAvailable: false,
    contractAligned: true,
    lastReviewedAt: new Date("2026-02-10")
  },
  {
    vendorName: "Internal MLOps Platform (Meridian IT)",
    vendorType: "OTHER",
    cosaiLayer: "LAYER_4_PLATFORM",
    soc2Status: "NOT_APPLICABLE",
    iso27001Status: "IN_PROGRESS",
    slsaLevel: "L1",
    modelCardAvailable: false,
    contractAligned: true,
    lastReviewedAt: new Date("2026-01-05")
  },
  {
    vendorName: "DataRobot",
    vendorType: "OTHER",
    cosaiLayer: "LAYER_3_APPLICATION",
    soc2Status: "CERTIFIED",
    soc2ExpiresAt: new Date("2026-07-31"),
    iso27001Status: "CERTIFIED",
    slsaLevel: "L2",
    modelCardAvailable: true,
    contractAligned: true,
    lastReviewedAt: new Date("2026-02-15")
  }
];

const SCANS: Array<{
  assetName: string;
  scanType:
    | "SBOM"
    | "SBOM_DEPENDENCY"
    | "VULN"
    | "SECRETS"
    | "POLICY"
    | "LICENSE"
    | "MODEL_SCAN"
    | "DATASET_PII"
    | "RED_TEAM";
  status: string;
  policyPassed: boolean;
  findingsCount: number;
  criticalFindings: number;
  completedAt: Date;
}> = [
  {
    assetName: "Quality Inspection Vision System",
    scanType: "MODEL_SCAN",
    status: "COMPLETED",
    policyPassed: true,
    findingsCount: 0,
    criticalFindings: 0,
    completedAt: new Date("2026-02-15")
  },
  {
    assetName: "Quality Inspection Vision System",
    scanType: "DATASET_PII",
    status: "COMPLETED",
    policyPassed: false,
    findingsCount: 3,
    criticalFindings: 3,
    completedAt: new Date("2026-02-15")
  },
  {
    assetName: "CV Screening Assistant",
    scanType: "MODEL_SCAN",
    status: "COMPLETED",
    policyPassed: true,
    findingsCount: 0,
    criticalFindings: 0,
    completedAt: new Date("2026-02-20")
  },
  {
    assetName: "CV Screening Assistant",
    scanType: "DATASET_PII",
    status: "COMPLETED",
    policyPassed: false,
    findingsCount: 5,
    criticalFindings: 5,
    completedAt: new Date("2026-02-20")
  },
  {
    assetName: "Fraud Detection System",
    scanType: "MODEL_SCAN",
    status: "COMPLETED",
    policyPassed: true,
    findingsCount: 0,
    criticalFindings: 0,
    completedAt: new Date("2026-02-18")
  },
  {
    assetName: "Fraud Detection System",
    scanType: "DATASET_PII",
    status: "COMPLETED",
    policyPassed: true,
    findingsCount: 0,
    criticalFindings: 0,
    completedAt: new Date("2026-02-18")
  },
  {
    assetName: "Log Analysis Agent",
    scanType: "SECRETS",
    status: "COMPLETED",
    policyPassed: true,
    findingsCount: 0,
    criticalFindings: 0,
    completedAt: new Date("2026-03-01")
  },
  {
    assetName: "Log Analysis Agent",
    scanType: "RED_TEAM",
    status: "COMPLETED",
    policyPassed: true,
    findingsCount: 0,
    criticalFindings: 0,
    completedAt: new Date("2026-03-01")
  },
  {
    assetName: "Predictive Maintenance AI",
    scanType: "MODEL_SCAN",
    status: "COMPLETED",
    policyPassed: true,
    findingsCount: 0,
    criticalFindings: 0,
    completedAt: new Date("2026-02-10")
  },
  {
    assetName: "Dynamic Pricing Model",
    scanType: "MODEL_SCAN",
    status: "COMPLETED",
    policyPassed: true,
    findingsCount: 2,
    criticalFindings: 0,
    completedAt: new Date("2026-02-25")
  },
  {
    assetName: "Network Anomaly Detector",
    scanType: "MODEL_SCAN",
    status: "COMPLETED",
    policyPassed: true,
    findingsCount: 0,
    criticalFindings: 0,
    completedAt: new Date("2026-03-02")
  },
  {
    assetName: "Network Anomaly Detector",
    scanType: "SECRETS",
    status: "COMPLETED",
    policyPassed: true,
    findingsCount: 0,
    criticalFindings: 0,
    completedAt: new Date("2026-03-02")
  },
  {
    assetName: "Inventory Reorder Agent",
    scanType: "RED_TEAM",
    status: "COMPLETED",
    policyPassed: false,
    findingsCount: 1,
    criticalFindings: 1,
    completedAt: new Date("2026-02-28")
  },
  {
    assetName: "Employee Sentiment Monitor",
    scanType: "DATASET_PII",
    status: "COMPLETED",
    policyPassed: false,
    findingsCount: 4,
    criticalFindings: 4,
    completedAt: new Date("2026-02-22")
  },
  {
    assetName: "Supplier Risk Scorer",
    scanType: "SBOM_DEPENDENCY",
    status: "COMPLETED",
    policyPassed: true,
    findingsCount: 0,
    criticalFindings: 0,
    completedAt: new Date("2026-02-12")
  }
];

export async function seedDemoEnterpriseP2(prisma: PrismaClient): Promise<void> {
  const org = await prisma.organization.findUnique({
    where: { slug: ORG_SLUG }
  });
  if (!org) {
    // eslint-disable-next-line no-console
    console.warn("Meridian Industrial org not found. Run demo-enterprise seed first.");
    return;
  }

  const assets = await prisma.aIAsset.findMany({
    where: { orgId: org.id, deletedAt: null },
    select: { id: true, name: true }
  });
  const assetIdsByName = new Map(assets.map((a) => [a.name, a.id]));

  let artifactCardCount = 0;
  for (const card of ARTIFACT_CARDS) {
    for (const assetName of card.linkedAssets) {
      const assetId = assetIdsByName.get(assetName);
      if (!assetId) continue;

      const existing = await prisma.artifactCard.findFirst({
        where: { orgId: org.id, assetId, cardType: "MODEL_CARD" }
      });

      if (!existing) {
        await prisma.artifactCard.create({
          data: {
            orgId: org.id,
            assetId,
            cardType: "MODEL_CARD",
            sourceFormat: card.sourceFormat,
            normalizedContent: card.normalizedContent as object,
            syncStatus: "SYNCED"
          }
        });
        artifactCardCount++;
      }
    }
  }

  for (const v of VENDORS) {
    const existing = await prisma.vendorAssurance.findFirst({
      where: { orgId: org.id, vendorName: v.vendorName }
    });
    const data = {
      vendorType: v.vendorType,
      cosaiLayer: v.cosaiLayer,
      soc2Status: v.soc2Status,
      soc2ExpiresAt: v.soc2ExpiresAt,
      iso27001Status: v.iso27001Status,
      slsaLevel: v.slsaLevel,
      modelCardAvailable: v.modelCardAvailable,
      contractAligned: v.contractAligned,
      lastReviewedAt: v.lastReviewedAt,
      evidenceLinks: v.evidenceLinks as object | undefined
    };
    if (existing) {
      await prisma.vendorAssurance.update({
        where: { id: existing.id },
        data
      });
    } else {
      await prisma.vendorAssurance.create({
        data: {
          orgId: org.id,
          vendorName: v.vendorName,
          ...data
        }
      });
    }
  }

  for (const s of SCANS) {
    const assetId = assetIdsByName.get(s.assetName);
    if (!assetId) continue;

    const existing = await prisma.scanRecord.findFirst({
      where: {
        orgId: org.id,
        assetId,
        scanType: s.scanType,
        completedAt: s.completedAt
      }
    });
    if (existing) continue;

    await prisma.scanRecord.create({
      data: {
        orgId: org.id,
        assetId,
        scannerName: "Governance Platform Scanner",
        scannerVersion: "1.0",
        scanType: s.scanType,
        status: s.status,
        startedAt: new Date(s.completedAt.getTime() - 60000),
        completedAt: s.completedAt,
        findingsCount: s.findingsCount,
        criticalFindings: s.criticalFindings,
        policyPassed: s.policyPassed
      }
    });
  }

  // eslint-disable-next-line no-console
  console.log(
    `Meridian P2 seeded: ${artifactCardCount} artifact cards, ${VENDORS.length} vendors, ${SCANS.length} scan records.`
  );
}
