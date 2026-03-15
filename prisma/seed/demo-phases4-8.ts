/**
 * Demo seed for Phases 4–8 – Meridian Industrial Group.
 * MaturityAssessment, MasterDataEntity, DataLineageRecord, DataGovernancePolicy,
 * RegulationDiscovery, ComplianceSnapshot, ProvenanceRecord.
 * Run AFTER demo-layer2.
 */
import type { PrismaClient } from "@prisma/client";

import { MATURITY_QUESTIONS } from "@/lib/maturity/questions";

export async function seedDemoPhases48(prisma: PrismaClient): Promise<void> {
  const meridian = await prisma.organization.findFirst({
    where: { name: { contains: "Meridian" } }
  });
  if (!meridian) {
    // eslint-disable-next-line no-console
    console.warn("Meridian Industrial org not found. Run demo-enterprise seed first.");
    return;
  }
  const orgId = meridian.id;

  // Ensure demo org has PRO tier for full platform access
  await prisma.organization.update({
    where: { id: orgId },
    data: { tier: "PRO" }
  });

  const assets = await prisma.aIAsset.findMany({
    where: { orgId, deletedAt: null },
    select: { id: true, name: true }
  });
  const assetByName = new Map(assets.map((a) => [a.name, a.id]));

  const users = await prisma.user.findMany({
    where: { orgId },
    select: { id: true }
  });
  const assessedBy = users[0]!.id;

  // 1. MaturityAssessment
  const scores = { L1: 2.5, L2: 1.8, L3: 2.2, L4: 3.0, L5: 2.8, overall: 2.5 };
  const answers = MATURITY_QUESTIONS.map((q) => {
    const layerKey = q.layer as "L1" | "L2" | "L3" | "L4" | "L5";
    const targetScore = Math.round((scores[layerKey] ?? 2.5) * 2) / 2;
    const score = Math.max(1, Math.min(5, Math.round(targetScore)));
    const answer = Math.max(0, Math.min(q.options.length - 1, score - 1));
    return { questionId: q.id, answer, score };
  });

  const existingMaturity = await prisma.maturityAssessment.findFirst({
    where: { orgId }
  });
  if (!existingMaturity) {
    await prisma.maturityAssessment.create({
      data: {
        orgId,
        assessedBy,
        scores: scores as object,
        answers: answers as object,
        maturityLevel: 2,
        notes: "Phases 4–8 demo assessment"
      }
    });
  }

  // 2. MasterDataEntity
  const masterDataEntities: Array<{
    name: string;
    entityType: "CUSTOMER" | "PRODUCT" | "VENDOR" | "EMPLOYEE" | "FINANCE" | "LOCATION" | "OTHER";
    classification: "PUBLIC" | "INTERNAL" | "CONFIDENTIAL" | "RESTRICTED";
    aiAccessPolicy: "OPEN" | "GOVERNED" | "RESTRICTED" | "PROHIBITED";
    recordCount?: number;
    qualityScore?: number;
    sourceSystem?: string;
  }> = [
    { name: "Customer Master", entityType: "CUSTOMER", classification: "RESTRICTED", aiAccessPolicy: "GOVERNED", recordCount: 125000, qualityScore: 92, sourceSystem: "SAP CRM" },
    { name: "Product Catalog", entityType: "PRODUCT", classification: "INTERNAL", aiAccessPolicy: "OPEN", recordCount: 45000, qualityScore: 98, sourceSystem: "SAP MDM" },
    { name: "Vendor Registry", entityType: "VENDOR", classification: "CONFIDENTIAL", aiAccessPolicy: "GOVERNED", recordCount: 3200, qualityScore: 88, sourceSystem: "SAP SRM" },
    { name: "Employee Records", entityType: "EMPLOYEE", classification: "RESTRICTED", aiAccessPolicy: "PROHIBITED", recordCount: 8500, qualityScore: 95, sourceSystem: "SAP SuccessFactors" },
    { name: "Finance Master", entityType: "FINANCE", classification: "CONFIDENTIAL", aiAccessPolicy: "RESTRICTED", recordCount: 210000, qualityScore: 89, sourceSystem: "SAP FI" },
    { name: "Plant Locations", entityType: "LOCATION", classification: "INTERNAL", aiAccessPolicy: "OPEN", recordCount: 42, qualityScore: 100, sourceSystem: "SAP EAM" },
    { name: "Distribution Centers", entityType: "LOCATION", classification: "INTERNAL", aiAccessPolicy: "OPEN", recordCount: 18, qualityScore: 97, sourceSystem: "SAP EWM" },
    { name: "HR Services Data", entityType: "OTHER", classification: "RESTRICTED", aiAccessPolicy: "RESTRICTED", recordCount: 12000, qualityScore: 85, sourceSystem: "SAP HCM" }
  ];

  const entityByName = new Map<string, string>();
  for (const e of masterDataEntities) {
    let entity = await prisma.masterDataEntity.findFirst({
      where: { orgId, name: e.name }
    });
    if (!entity) {
      entity = await prisma.masterDataEntity.create({
        data: {
          orgId,
          name: e.name,
          entityType: e.entityType,
          description: `${e.entityType} master data entity`,
          classification: e.classification,
          aiAccessPolicy: e.aiAccessPolicy,
          recordCount: e.recordCount,
          qualityScore: e.qualityScore,
          sourceSystem: e.sourceSystem
        }
      });
    }
    entityByName.set(e.name, entity.id);
  }

  // 3. DataLineageRecord
  const lineageRecords: Array<{
    sourceEntity: string;
    targetAsset: string;
    pipelineType: string;
    refreshFrequency: string;
  }> = [
    { sourceEntity: "Customer Master", targetAsset: "Customer Churn Predictor", pipelineType: "ETL", refreshFrequency: "DAILY" },
    { sourceEntity: "Product Catalog", targetAsset: "Production Schedule Optimizer", pipelineType: "API", refreshFrequency: "REALTIME" },
    { sourceEntity: "Employee Records", targetAsset: "CV Screening Assistant", pipelineType: "BATCH", refreshFrequency: "WEEKLY" },
    { sourceEntity: "Finance Master", targetAsset: "Cash Flow Predictor", pipelineType: "ETL", refreshFrequency: "DAILY" },
    { sourceEntity: "Plant Locations", targetAsset: "Equipment Failure Predictor", pipelineType: "STREAM", refreshFrequency: "REALTIME" },
    { sourceEntity: "Vendor Registry", targetAsset: "Supplier Risk Scorer", pipelineType: "API", refreshFrequency: "DAILY" }
  ];

  for (const lr of lineageRecords) {
    const sourceId = entityByName.get(lr.sourceEntity);
    const targetId = assetByName.get(lr.targetAsset);
    if (!sourceId || !targetId) continue;

    const existing = await prisma.dataLineageRecord.findFirst({
      where: { orgId, sourceEntityId: sourceId, targetAssetId: targetId }
    });
    if (!existing) {
      await prisma.dataLineageRecord.create({
        data: {
          orgId,
          name: `${lr.sourceEntity} → ${lr.targetAsset}`,
          description: `${lr.pipelineType} pipeline, ${lr.refreshFrequency} refresh`,
          sourceEntityId: sourceId,
          targetAssetId: targetId,
          pipelineType: lr.pipelineType,
          refreshFrequency: lr.refreshFrequency
        }
      });
    }
  }

  // 4. DataGovernancePolicy
  const policies: Array<{
    name: string;
    policyType: string;
    description: string;
    appliesTo: ("PUBLIC" | "INTERNAL" | "CONFIDENTIAL" | "RESTRICTED")[];
    controls: string[];
    status: string;
  }> = [
    {
      name: "PII Handling Policy",
      policyType: "PRIVACY",
      description: "Governs collection, storage, and use of personally identifiable information in AI systems",
      appliesTo: ["RESTRICTED", "CONFIDENTIAL"],
      controls: ["Data minimization", "Consent documentation", "Retention limits", "Access logging"],
      status: "APPROVED"
    },
    {
      name: "AI Training Data Policy",
      policyType: "ACCESS",
      description: "Defines acceptable data sources and governance for AI training datasets",
      appliesTo: ["INTERNAL", "CONFIDENTIAL", "RESTRICTED"],
      controls: ["Source approval", "Lineage documentation", "Quality thresholds"],
      status: "APPROVED"
    },
    {
      name: "Shadow AI Acceptable Use",
      policyType: "ACCESS",
      description: "Guidelines for discovery and governance of ungoverned AI usage",
      appliesTo: ["INTERNAL", "CONFIDENTIAL"],
      controls: ["Discovery cadence", "Risk assessment", "Remediation workflow"],
      status: "APPROVED"
    }
  ];

  for (const p of policies) {
    const existing = await prisma.dataGovernancePolicy.findFirst({
      where: { orgId, name: p.name }
    });
    const approvedAt = p.status === "APPROVED" ? new Date() : null;
    if (!existing) {
      await prisma.dataGovernancePolicy.create({
        data: {
          orgId,
          name: p.name,
          policyType: p.policyType,
          description: p.description,
          appliesTo: p.appliesTo,
          controls: p.controls,
          status: p.status,
          approvedAt
        }
      });
    }
  }

  // 5. RegulationDiscovery
  const creditScoringInputs = {
    assetType: "MODEL",
    description: "Credit scoring model for loan decisions",
    businessFunction: "Finance",
    decisionsAffectingPeople: true,
    interactsWithEndUsers: false,
    deployment: "EU_market",
    verticals: ["FINANCIAL_SERVICES"],
    autonomyLevel: "L2",
    dataTypes: ["PII", "Financial"],
    euResidentsData: "Yes" as const,
    expectedRiskLevel: "High" as const,
    vulnerablePopulations: true
  };
  const creditScoringResults = {
    mandatory: [
      { code: "EU_AI_ACT", name: "EU AI Act", jurisdiction: "EU", applicability: "MANDATORY", keyRequirements: "High-risk AI system obligations", implementationEffort: "High" as const },
      { code: "SR_11_7", name: "SR 11-7", jurisdiction: "US", applicability: "MANDATORY", keyRequirements: "Model risk management", implementationEffort: "Medium" as const },
      { code: "DORA", name: "DORA", jurisdiction: "EU", applicability: "MANDATORY", keyRequirements: "ICT risk management", implementationEffort: "Medium" as const }
    ],
    likelyApplicable: [],
    recommended: [],
    requiredControls: [],
    estimatedMaturityRequired: 3,
    riskScore: 72
  };

  const equipmentFailureAssetId = assetByName.get("Equipment Failure Predictor") ?? null;
  const equipmentInputs = {
    assetType: "MODEL",
    description: "Equipment failure prediction for preventive maintenance",
    businessFunction: "Operations",
    decisionsAffectingPeople: false,
    interactsWithEndUsers: false,
    deployment: "Global",
    verticals: ["MANUFACTURING"],
    autonomyLevel: "L2",
    dataTypes: ["Sensor", "Operational"],
    euResidentsData: "No" as const,
    expectedRiskLevel: "Medium" as const,
    vulnerablePopulations: false
  };
  const equipmentResults = {
    mandatory: [],
    likelyApplicable: [
      { code: "EU_AI_ACT", name: "EU AI Act", jurisdiction: "EU", applicability: "LIKELY_APPLICABLE", keyRequirements: "Limited risk obligations", implementationEffort: "Medium" as const },
      { code: "ISO_42001", name: "ISO 42001", jurisdiction: "International", applicability: "LIKELY_APPLICABLE", keyRequirements: "AI management system", implementationEffort: "High" as const }
    ],
    recommended: [],
    requiredControls: [],
    estimatedMaturityRequired: 2,
    riskScore: 45
  };

  const existingCreditDiscovery = await prisma.regulationDiscovery.findFirst({
    where: { orgId, assetId: null }
  });
  if (!existingCreditDiscovery) {
    await prisma.regulationDiscovery.create({
      data: {
        orgId,
        inputs: creditScoringInputs as object,
        results: creditScoringResults as object
      }
    });
  }

  const existingEquipmentDiscovery = await prisma.regulationDiscovery.findFirst({
    where: { orgId, assetId: equipmentFailureAssetId }
  });
  if (!existingEquipmentDiscovery && equipmentFailureAssetId) {
    await prisma.regulationDiscovery.create({
      data: {
        orgId,
        assetId: equipmentFailureAssetId,
        inputs: equipmentInputs as object,
        results: equipmentResults as object,
        createdBy: assessedBy
      }
    });
  }

  // 6. ComplianceSnapshot
  const now = new Date();
  const snapshots: Array<{
    createdAt: Date;
    overallScore: number;
    layerScores: { L1: number; L2: number; L3: number; L4: number; L5: number };
  }> = [
    { createdAt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), overallScore: 28, layerScores: { L1: 32, L2: 18, L3: 25, L4: 38, L5: 30 } },
    { createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), overallScore: 35, layerScores: { L1: 38, L2: 25, L3: 32, L4: 42, L5: 36 } },
    { createdAt: now, overallScore: 40, layerScores: { L1: 42, L2: 32, L3: 38, L4: 45, L5: 40 } }
  ];

  const assetCount = assets.length;
  for (const s of snapshots) {
    const existing = await prisma.complianceSnapshot.findFirst({
      where: {
        orgId,
        createdAt: { gte: new Date(s.createdAt.getTime() - 86400000), lte: new Date(s.createdAt.getTime() + 86400000) }
      }
    });
    if (!existing) {
      const controlsTotal = 80;
      const controlsCompliant = Math.round(controlsTotal * (s.overallScore / 100));
      await prisma.complianceSnapshot.create({
        data: {
          orgId,
          createdBy: assessedBy,
          snapshotType: "SCHEDULED",
          frameworkCode: "EU_AI_ACT",
          overallScore: s.overallScore,
          layerScores: s.layerScores as object,
          assetCount,
          controlsCompliant,
          controlsTotal,
          gapCount: controlsTotal - controlsCompliant,
          evidenceCompleteness: s.overallScore * 0.9,
          createdAt: s.createdAt
        }
      });
    }
  }

  // 7. ProvenanceRecord
  const openaiVendor = await prisma.vendorAssurance.findFirst({
    where: { orgId, vendorName: "OpenAI" },
    select: { id: true }
  });
  const anthropicVendor = await prisma.vendorAssurance.findFirst({
    where: { orgId, vendorName: "Anthropic" },
    select: { id: true }
  });

  const provenanceRecords: Array<{
    vendorName: string;
    modelName: string;
    steps: Array<{ stepType: string; description: string }>;
  }> = [
    {
      vendorName: "OpenAI",
      modelName: "GPT-4o",
      steps: [
        { stepType: "TRAINING_DATA", description: "Large-scale web and licensed data" },
        { stepType: "BASE_MODEL", description: "Pre-training and alignment" }
      ]
    },
    {
      vendorName: "Anthropic",
      modelName: "Claude Sonnet",
      steps: [
        { stepType: "TRAINING_DATA", description: "Constitutional AI training data" },
        { stepType: "BASE_MODEL", description: "Pre-training and RLHF" }
      ]
    }
  ];

  for (const pr of provenanceRecords) {
    const vendor = pr.vendorName === "OpenAI" ? openaiVendor : anthropicVendor;
    if (!vendor) continue;

    for (const step of pr.steps) {
      const existing = await prisma.provenanceRecord.findFirst({
        where: { orgId, vendorId: vendor.id, modelName: pr.modelName, stepType: step.stepType }
      });
      if (!existing) {
        await prisma.provenanceRecord.create({
          data: {
            orgId,
            vendorId: vendor.id,
            modelName: pr.modelName,
            stepType: step.stepType,
            description: step.description,
            occurredAt: new Date()
          }
        });
      }
    }
  }

  // 8. Update Organization
  await prisma.organization.update({
    where: { id: orgId },
    data: { maturityLevel: 2, onboardingComplete: true }
  });

  // eslint-disable-next-line no-console
  console.log("Phases 4–8 demo seeded: MaturityAssessment, MasterDataEntity, DataLineageRecord, DataGovernancePolicy, RegulationDiscovery, ComplianceSnapshot, ProvenanceRecord.");
}
