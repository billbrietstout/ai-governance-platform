/**
 * Layer 2 demo seed – Prompt templates, datasets, for Meridian Industrial.
 * Run AFTER demo-enterprise-p4.
 */
import type { PrismaClient } from "@prisma/client";

const ORG_SLUG = "meridian-industrial";

const PROMPT_TEMPLATES: Array<{
  templateName: string;
  assetName: string;
  type: "SYSTEM" | "USER" | "RAG" | "AGENT_PLANNING" | "TOOL_CALLING";
  status: "DRAFT" | "REVIEW" | "APPROVED" | "DEPRECATED";
  riskFlag?: string;
}> = [
  {
    templateName: "Customer Service Response",
    assetName: "IT Helpdesk Chatbot",
    type: "SYSTEM",
    status: "APPROVED"
  },
  {
    templateName: "CV Screening Instructions",
    assetName: "CV Screening Assistant",
    type: "SYSTEM",
    status: "REVIEW",
    riskFlag: "HIGH risk — employment decision"
  },
  {
    templateName: "Sentiment Analysis Prompt",
    assetName: "Employee Sentiment Monitor",
    type: "SYSTEM",
    status: "REVIEW",
    riskFlag: "HIGH risk — worker monitoring"
  },
  {
    templateName: "Invoice Extraction Template",
    assetName: "Accounts Payable Automation",
    type: "SYSTEM",
    status: "APPROVED"
  },
  {
    templateName: "Fraud Detection Context",
    assetName: "Fraud Detection System",
    type: "RAG",
    status: "APPROVED"
  },
  {
    templateName: "Maintenance Prediction Context",
    assetName: "Predictive Maintenance AI",
    type: "RAG",
    status: "APPROVED"
  },
  {
    templateName: "Price Optimization Instructions",
    assetName: "Dynamic Pricing Model",
    type: "SYSTEM",
    status: "REVIEW",
    riskFlag: "HIGH risk — pricing transparency"
  },
  {
    templateName: "Supplier Risk Assessment",
    assetName: "Supplier Risk Scorer",
    type: "SYSTEM",
    status: "APPROVED"
  },
  {
    templateName: "Contract Analysis Template",
    assetName: "Contract Analysis Assistant",
    type: "RAG",
    status: "APPROVED"
  },
  {
    templateName: "Regulatory Change Monitor",
    assetName: "Regulatory Change Monitor",
    type: "AGENT_PLANNING",
    status: "DRAFT"
  },
  {
    templateName: "Log Analysis Agent Instructions",
    assetName: "Log Analysis Agent",
    type: "AGENT_PLANNING",
    status: "APPROVED"
  },
  {
    templateName: "ESG Report Generator",
    assetName: "ESG Reporting Assistant",
    type: "SYSTEM",
    status: "DRAFT"
  }
];

const DATASETS: Array<{
  name: string;
  type: "TRAINING" | "INFERENCE" | "RAG_CORPUS" | "REFERENCE";
  classification: "PUBLIC" | "INTERNAL" | "CONFIDENTIAL" | "RESTRICTED";
  pii: boolean;
  usedBy: string[];
  stewardEmail: string;
  lastAudited: string;
  issues?: string;
}> = [
  {
    name: "Employee HR Records",
    type: "INFERENCE",
    classification: "RESTRICTED",
    pii: true,
    usedBy: ["CV Screening Assistant", "Employee Sentiment Monitor"],
    stewardEmail: "nina.volkov@meridian-industrial.com",
    lastAudited: "2026-01-15",
    issues: "Consent documentation incomplete"
  },
  {
    name: "Transaction History 36mo",
    type: "TRAINING",
    classification: "CONFIDENTIAL",
    pii: true,
    usedBy: ["Fraud Detection System"],
    stewardEmail: "carlos.mendez@meridian-industrial.com",
    lastAudited: "2026-02-01"
  },
  {
    name: "Sensor Telemetry Data",
    type: "TRAINING",
    classification: "INTERNAL",
    pii: false,
    usedBy: ["Predictive Maintenance AI", "Equipment Failure Predictor"],
    stewardEmail: "david.kim@meridian-industrial.com",
    lastAudited: "2026-02-10"
  },
  {
    name: "Product Catalog",
    type: "RAG_CORPUS",
    classification: "INTERNAL",
    pii: false,
    usedBy: ["Product Recommendation Engine", "IT Helpdesk Chatbot"],
    stewardEmail: "tom.bradley@meridian-industrial.com",
    lastAudited: "2026-01-20"
  },
  {
    name: "Customer Purchase History",
    type: "INFERENCE",
    classification: "CONFIDENTIAL",
    pii: true,
    usedBy: ["Customer Churn Predictor", "Dynamic Pricing Model"],
    stewardEmail: "tom.bradley@meridian-industrial.com",
    lastAudited: "2026-01-25",
    issues: "GDPR retention policy not documented"
  },
  {
    name: "Supplier Performance Data",
    type: "TRAINING",
    classification: "INTERNAL",
    pii: false,
    usedBy: ["Supplier Risk Scorer", "Inventory Reorder Agent"],
    stewardEmail: "lisa.wang@meridian-industrial.com",
    lastAudited: "2026-02-05"
  },
  {
    name: "Financial Transactions",
    type: "INFERENCE",
    classification: "RESTRICTED",
    pii: true,
    usedBy: ["Accounts Payable Automation", "Cash Flow Predictor"],
    stewardEmail: "carlos.mendez@meridian-industrial.com",
    lastAudited: "2026-02-12"
  },
  {
    name: "Regulatory Document Corpus",
    type: "RAG_CORPUS",
    classification: "INTERNAL",
    pii: false,
    usedBy: ["Regulatory Change Monitor", "Contract Analysis Assistant"],
    stewardEmail: "priya.patel@meridian-industrial.com",
    lastAudited: "2026-02-20"
  },
  {
    name: "Quality Inspection Images",
    type: "TRAINING",
    classification: "INTERNAL",
    pii: false,
    usedBy: ["Quality Inspection Vision System"],
    stewardEmail: "david.kim@meridian-industrial.com",
    lastAudited: "2026-02-15"
  },
  {
    name: "Network Log Data",
    type: "INFERENCE",
    classification: "CONFIDENTIAL",
    pii: false,
    usedBy: ["Network Anomaly Detector", "Log Analysis Agent"],
    stewardEmail: "marco.rossi@meridian-industrial.com",
    lastAudited: "2026-03-01"
  }
];

export async function seedDemoLayer2(prisma: PrismaClient): Promise<void> {
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
    select: { id: true, name: true, euRiskLevel: true, ownerId: true }
  });
  const assetByName = new Map(assets.map((a) => [a.name, a]));

  const users = await prisma.user.findMany({
    where: { orgId: org.id },
    select: { id: true, email: true }
  });
  const userByEmail = new Map(users.map((u) => [u.email, u]));

  let promptCount = 0;
  for (const pt of PROMPT_TEMPLATES) {
    const asset = assetByName.get(pt.assetName);
    if (!asset) continue;

    const existingCards = await prisma.artifactCard.findMany({
      where: { orgId: org.id, assetId: asset.id, cardType: "PROMPT_TEMPLATE" }
    });
    const hasTemplate = existingCards.some(
      (c) => (c.normalizedContent as { templateName?: string })?.templateName === pt.templateName
    );
    if (hasTemplate) continue;

    const riskLevel =
      asset.euRiskLevel === "HIGH"
        ? "HIGH"
        : asset.euRiskLevel === "UNACCEPTABLE"
          ? "HIGH"
          : asset.euRiskLevel === "LIMITED"
            ? "MEDIUM"
            : "LOW";
    const lastReviewed =
      pt.status === "APPROVED" ? new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) : null;

    await prisma.artifactCard.create({
      data: {
        orgId: org.id,
        assetId: asset.id,
        cardType: "PROMPT_TEMPLATE",
        sourceFormat: "MANUAL",
        normalizedContent: {
          templateName: pt.templateName,
          type: pt.type,
          status: pt.status,
          riskLevel,
          riskFlag: pt.riskFlag ?? null,
          lastReviewed: lastReviewed?.toISOString() ?? null
        } as object,
        syncStatus: "SYNCED"
      }
    });
    promptCount++;
  }

  let datasetCount = 0;
  for (const ds of DATASETS) {
    const existingAsset = await prisma.aIAsset.findFirst({
      where: { orgId: org.id, name: ds.name, assetType: "DATASET" }
    });
    let datasetAsset = existingAsset;
    if (!datasetAsset) {
      const steward = userByEmail.get(ds.stewardEmail);
      datasetAsset = await prisma.aIAsset.create({
        data: {
          orgId: org.id,
          name: ds.name,
          description: `${ds.type} dataset — ${ds.classification} classification`,
          assetType: "DATASET",
          status: "ACTIVE",
          ownerId: steward?.id ?? null
        }
      });
    }

    const existingCard = await prisma.artifactCard.findFirst({
      where: { orgId: org.id, assetId: datasetAsset.id, cardType: "DATASET_CARD" }
    });
    if (existingCard) continue;

    await prisma.artifactCard.create({
      data: {
        orgId: org.id,
        assetId: datasetAsset.id,
        cardType: "DATASET_CARD",
        sourceFormat: "MANUAL",
        normalizedContent: {
          datasetName: ds.name,
          type: ds.type,
          classification: ds.classification,
          pii: ds.pii,
          usedBy: ds.usedBy,
          stewardEmail: ds.stewardEmail,
          lastAudited: ds.lastAudited,
          issues: ds.issues ?? null,
          complianceStatus: ds.issues ? "INCOMPLETE" : "COMPLIANT"
        } as object,
        syncStatus: "SYNCED"
      }
    });
    datasetCount++;
  }

  // eslint-disable-next-line no-console
  console.log(`Layer 2 seeded: ${promptCount} prompt templates, ${datasetCount} datasets.`);
}
