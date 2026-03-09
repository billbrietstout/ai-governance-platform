/**
 * Meridian Industrial demo seed – Part 4.
 * SAP business processes, LLM reference library, Acme Corp asset updates.
 * Run AFTER demo-enterprise-p3.
 */
import type { PrismaClient } from "@prisma/client";

const ORG_SLUG = "meridian-industrial";

type ProcessInput = {
  name: string;
  description: string;
  cosaiLayer: "LAYER_1_BUSINESS" | "LAYER_3_APPLICATION" | "LAYER_4_PLATFORM";
  euRiskLevel: "MINIMAL" | "LIMITED" | "HIGH";
  autonomyLevel: "ASSISTED" | "SEMI_AUTONOMOUS" | "AUTONOMOUS";
};

const SAP_PROCESSES: ProcessInput[] = [
  { name: "SAP PP-001: Production Planning & Scheduling", description: "MRP-driven production order creation and capacity planning", cosaiLayer: "LAYER_1_BUSINESS", euRiskLevel: "LIMITED", autonomyLevel: "ASSISTED" },
  { name: "SAP PM-001: Predictive Maintenance Scheduling", description: "AI-driven equipment maintenance based on sensor telemetry", cosaiLayer: "LAYER_4_PLATFORM", euRiskLevel: "LIMITED", autonomyLevel: "SEMI_AUTONOMOUS" },
  { name: "SAP QM-001: Automated Quality Inspection", description: "Computer vision quality gate at production line", cosaiLayer: "LAYER_3_APPLICATION", euRiskLevel: "HIGH", autonomyLevel: "SEMI_AUTONOMOUS" },
  { name: "SAP MM-001: Intelligent Procurement", description: "AI-assisted supplier selection and PO generation", cosaiLayer: "LAYER_3_APPLICATION", euRiskLevel: "LIMITED", autonomyLevel: "SEMI_AUTONOMOUS" },
  { name: "SAP MM-002: Inventory Optimization", description: "ML-based reorder point and safety stock calculation", cosaiLayer: "LAYER_3_APPLICATION", euRiskLevel: "LIMITED", autonomyLevel: "SEMI_AUTONOMOUS" },
  { name: "SAP EWM-001: Warehouse Picking Optimization", description: "AI route optimization for warehouse picking operations", cosaiLayer: "LAYER_3_APPLICATION", euRiskLevel: "MINIMAL", autonomyLevel: "ASSISTED" },
  { name: "SAP PP-002: Demand-Driven MRP", description: "Demand sensing and supply buffer optimization", cosaiLayer: "LAYER_3_APPLICATION", euRiskLevel: "LIMITED", autonomyLevel: "ASSISTED" },
  { name: "SAP PM-002: Equipment Failure Prediction", description: "LSTM model predicting component failure 72hrs ahead", cosaiLayer: "LAYER_4_PLATFORM", euRiskLevel: "LIMITED", autonomyLevel: "SEMI_AUTONOMOUS" },
  { name: "SAP CO-001: Cost Center Variance Analysis", description: "Automated variance detection and root cause suggestion", cosaiLayer: "LAYER_3_APPLICATION", euRiskLevel: "LIMITED", autonomyLevel: "ASSISTED" },
  { name: "SAP EHS-001: Safety Incident Prediction", description: "AI model predicting workplace safety incidents (EU AI Act Annex III — workplace safety systems)", cosaiLayer: "LAYER_3_APPLICATION", euRiskLevel: "HIGH", autonomyLevel: "ASSISTED" },
  { name: "SAP TM-001: Transport Route Optimization", description: "ML optimization of delivery routes and carrier selection", cosaiLayer: "LAYER_3_APPLICATION", euRiskLevel: "MINIMAL", autonomyLevel: "SEMI_AUTONOMOUS" },
  { name: "SAP PS-001: Project Cost Forecasting", description: "AI-driven project completion and cost prediction", cosaiLayer: "LAYER_3_APPLICATION", euRiskLevel: "LIMITED", autonomyLevel: "ASSISTED" },
  { name: "SAP SD-001: Intelligent Order Management", description: "AI-assisted order promising and ATP checking", cosaiLayer: "LAYER_3_APPLICATION", euRiskLevel: "MINIMAL", autonomyLevel: "ASSISTED" },
  { name: "SAP SD-002: Dynamic Pricing Engine", description: "Real-time competitive and demand-based price optimization (HIGH autonomy — human oversight required)", cosaiLayer: "LAYER_3_APPLICATION", euRiskLevel: "HIGH", autonomyLevel: "AUTONOMOUS" },
  { name: "SAP CRM-001: Customer Lifetime Value Scoring", description: "ML model scoring customer retention risk and LTV", cosaiLayer: "LAYER_3_APPLICATION", euRiskLevel: "LIMITED", autonomyLevel: "ASSISTED" },
  { name: "SAP CRM-002: Personalization Engine", description: "Product and content recommendation at scale", cosaiLayer: "LAYER_3_APPLICATION", euRiskLevel: "MINIMAL", autonomyLevel: "ASSISTED" },
  { name: "SAP FI-001: Accounts Payable Automation", description: "Invoice OCR, matching and automated payment approval", cosaiLayer: "LAYER_3_APPLICATION", euRiskLevel: "LIMITED", autonomyLevel: "SEMI_AUTONOMOUS" },
  { name: "SAP FI-002: Cash Flow Forecasting", description: "ML model predicting 13-week cash position", cosaiLayer: "LAYER_3_APPLICATION", euRiskLevel: "LIMITED", autonomyLevel: "ASSISTED" },
  { name: "SAP FI-003: Fraud Detection", description: "Real-time transaction fraud scoring and blocking", cosaiLayer: "LAYER_3_APPLICATION", euRiskLevel: "HIGH", autonomyLevel: "SEMI_AUTONOMOUS" },
  { name: "SAP HR-001: Recruitment Screening", description: "AI-assisted CV screening and candidate ranking (EU AI Act Annex III No.4 — employment decisions)", cosaiLayer: "LAYER_3_APPLICATION", euRiskLevel: "HIGH", autonomyLevel: "SEMI_AUTONOMOUS" },
  { name: "SAP HR-002: Workforce Planning", description: "Headcount forecasting and skills gap analysis", cosaiLayer: "LAYER_3_APPLICATION", euRiskLevel: "LIMITED", autonomyLevel: "ASSISTED" },
  { name: "SAP GRC-001: Compliance Monitoring", description: "Automated regulatory change detection and impact assessment", cosaiLayer: "LAYER_1_BUSINESS", euRiskLevel: "LIMITED", autonomyLevel: "ASSISTED" },
  { name: "SAP GRC-002: Audit Risk Scoring", description: "ML-based audit scope prioritization", cosaiLayer: "LAYER_3_APPLICATION", euRiskLevel: "HIGH", autonomyLevel: "ASSISTED" },
  { name: "SAP CS-001: Customer Service Agent", description: "LLM-powered customer service with escalation routing", cosaiLayer: "LAYER_3_APPLICATION", euRiskLevel: "LIMITED", autonomyLevel: "SEMI_AUTONOMOUS" }
];

const LLM_REFERENCE_CARDS: Array<Record<string, unknown>> = [
  { modelName: "GPT-4.1", organization: "OpenAI", contextWindow: 1000000, pricing: "$2/1M input tokens", benchmarks: { MMLU: 90.2, HumanEval: 92.1, GPQA: 66.3 }, euAiActRiskLevel: "MINIMAL", license: "Commercial API" },
  { modelName: "GPT-4o mini", organization: "OpenAI", contextWindow: 128000, pricing: "$0.15/1M input", benchmarks: { MMLU: 82.0, HumanEval: 87.2 }, bestFor: "High-volume, cost-sensitive enterprise tasks", euAiActRiskLevel: "MINIMAL", license: "Commercial API" },
  { modelName: "Claude Opus 4", organization: "Anthropic", contextWindow: 200000, benchmarks: { MMLU: 91.1, HumanEval: 94.2, GPQA: 74.1 }, bestFor: "Complex reasoning, long document analysis", euAiActRiskLevel: "MINIMAL", license: "Commercial API" },
  { modelName: "Claude Haiku 4", organization: "Anthropic", contextWindow: 200000, bestFor: "Fast, cost-effective extraction and classification", euAiActRiskLevel: "MINIMAL", license: "Commercial API" },
  { modelName: "Gemini 2.5 Pro", organization: "Google", contextWindow: 1000000, benchmarks: { MMLU: 90.0, HumanEval: 91.5 }, bestFor: "Multimodal, long context enterprise workflows", euAiActRiskLevel: "MINIMAL", license: "Commercial API" },
  { modelName: "Gemini 2.5 Flash", organization: "Google", contextWindow: 1000000, bestFor: "High-throughput document processing", euAiActRiskLevel: "MINIMAL", license: "Commercial API" },
  { modelName: "Llama 4 Maverick", organization: "Meta", contextWindow: 128000, benchmarks: { MMLU: 85.5, HumanEval: 88.3 }, bestFor: "On-premise deployment, data sovereignty requirements", euAiActRiskLevel: "MINIMAL", license: "Llama 4 Community License" },
  { modelName: "Llama 4 Scout", organization: "Meta", contextWindow: 10000000, bestFor: "Ultra-long context on-premise workloads", euAiActRiskLevel: "MINIMAL", license: "Llama 4 Community License" },
  { modelName: "Mistral Large 3", organization: "Mistral AI", contextWindow: 128000, bestFor: "European data residency, GDPR-first deployments", note: "EU-headquartered provider — preferred for EU AI Act compliance", euAiActRiskLevel: "MINIMAL", license: "Commercial API" },
  { modelName: "DeepSeek R1", organization: "DeepSeek", bestFor: "Complex reasoning tasks, cost-effective on-premise", securityNote: "SECURITY ADVISORY: Review data handling before use with sensitive data. Chinese jurisdiction concerns for regulated industries.", euAiActRiskLevel: "HIGH", license: "Open Source" },
  { modelName: "Command R+", organization: "Cohere", contextWindow: 128000, bestFor: "RAG-optimized, enterprise search augmentation", euAiActRiskLevel: "MINIMAL", license: "Commercial API" },
  { modelName: "Grok 3", organization: "xAI", contextWindow: 131000, bestFor: "Real-time data access, social/market intelligence", euAiActRiskLevel: "MINIMAL", license: "Commercial API" },
  { modelName: "IBM Granite 3.2", organization: "IBM", bestFor: "Regulated industries, full model transparency and audit trail", note: "IBM indemnification available for enterprise contracts", euAiActRiskLevel: "MINIMAL", license: "Open Source" },
  { modelName: "text-embedding-3-large", organization: "OpenAI", bestFor: "RAG knowledge base, semantic search", euAiActRiskLevel: "MINIMAL", license: "Commercial API", modelType: "embedding" },
  { modelName: "voyage-3-large", organization: "Voyage AI", bestFor: "High-accuracy retrieval for legal and compliance documents", euAiActRiskLevel: "MINIMAL", license: "Commercial API", modelType: "embedding" }
];

const ACME_RENAMES: Array<{ oldName: string; newName: string }> = [
  { oldName: "Customer Support Chatbot", newName: "Demo Asset Alpha" },
  { oldName: "Fraud Detection Model", newName: "Demo Asset Beta" },
  { oldName: "Document Summarization Pipeline", newName: "Demo Asset Gamma" },
  { oldName: "HR Screening Assistant", newName: "Demo Asset Delta" }
];

export async function seedDemoEnterpriseP4(prisma: PrismaClient): Promise<void> {
  const org = await prisma.organization.findUnique({
    where: { slug: ORG_SLUG }
  });
  if (!org) {
    // eslint-disable-next-line no-console
    console.warn("Meridian Industrial org not found. Run demo-enterprise seed first.");
    return;
  }

  const jamesUser = await prisma.user.findFirst({
    where: { orgId: org.id, email: "james.okonkwo@meridian-industrial.com" },
    select: { id: true }
  });
  const ownerId = jamesUser?.id ?? null;

  for (const p of SAP_PROCESSES) {
    const existing = await prisma.aIAsset.findFirst({
      where: { orgId: org.id, name: p.name }
    });
    if (!existing) {
      await prisma.aIAsset.create({
        data: {
          orgId: org.id,
          name: p.name,
          description: p.description,
          assetType: "PIPELINE",
          euRiskLevel: p.euRiskLevel,
          cosaiLayer: p.cosaiLayer,
          autonomyLevel: p.autonomyLevel,
          verticalMarket: "GENERAL",
          status: "DRAFT",
          ownerId
        }
      });
    }
  }

  let libraryAsset = await prisma.aIAsset.findFirst({
    where: { orgId: org.id, name: "LLM Reference Library" }
  });
  if (!libraryAsset) {
    libraryAsset = await prisma.aIAsset.create({
      data: {
        orgId: org.id,
        name: "LLM Reference Library",
        description: "Reference library of production LLMs for discovery and comparison. Not yet linked to governed assets.",
        assetType: "APPLICATION",
        verticalMarket: "GENERAL",
        status: "DRAFT",
        ownerId
      }
    });
  }

  const existingCards = await prisma.artifactCard.findMany({
    where: { orgId: org.id, assetId: libraryAsset.id, cardType: "MODEL_CARD" }
  });
  const existingModels = new Set(
    existingCards
      .map((c) => (c.normalizedContent as Record<string, unknown>)?.modelName as string)
      .filter(Boolean)
  );

  for (const card of LLM_REFERENCE_CARDS) {
    const modelName = card.modelName as string;
    if (existingModels.has(modelName)) continue;
    await prisma.artifactCard.create({
      data: {
        orgId: org.id,
        assetId: libraryAsset.id,
        cardType: "MODEL_CARD",
        sourceFormat: "MANUAL",
        normalizedContent: { ...card } as object,
        syncStatus: "SYNCED"
      }
    });
    existingModels.add(modelName);
  }

  const acmeOrg = await prisma.organization.findUnique({
    where: { slug: "acme-corp" }
  });
  if (acmeOrg) {
    for (const r of ACME_RENAMES) {
      const asset = await prisma.aIAsset.findFirst({
        where: { orgId: acmeOrg.id, name: r.oldName }
      });
      if (asset) {
        await prisma.aIAsset.update({
          where: { id: asset.id },
          data: { name: r.newName, status: "ARCHIVED" }
        });
      }
    }
  }

  // eslint-disable-next-line no-console
  console.log(
    `Meridian P4 seeded: ${SAP_PROCESSES.length} SAP processes, ${LLM_REFERENCE_CARDS.length} LLM reference cards, Acme assets renamed and archived.`
  );
}
