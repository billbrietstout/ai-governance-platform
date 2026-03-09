/**
 * Meridian Industrial demo seed – Part 3.
 * Control attestations, accountability assignments, feature flags.
 * Run AFTER demo-enterprise-p2. Seeds frameworks for Meridian if missing.
 */
import type { PrismaClient } from "@prisma/client";

import { seedFrameworks } from "./frameworks";

const ORG_SLUG = "meridian-industrial";

const HIGH_RISK_ASSETS = [
  "CV Screening Assistant",
  "Quality Inspection Vision System",
  "Dynamic Pricing Model",
  "Fraud Detection System",
  "Employee Sentiment Monitor",
  "Audit Risk Scorer"
];

const LIMITED_SAMPLE_ASSETS = [
  "Predictive Maintenance AI",
  "Production Schedule Optimizer",
  "Inventory Reorder Agent",
  "Supply Chain Demand Forecaster",
  "Customer Churn Predictor",
  "Returns Classification Agent",
  "Accounts Payable Automation",
  "Log Analysis Agent",
  "Network Anomaly Detector",
  "Regulatory Change Monitor"
];

const MINIMAL_SAMPLE_ASSETS = [
  "Product Recommendation Engine",
  "Energy Consumption Optimizer",
  "IT Helpdesk Chatbot",
  "Board Report Generator",
  "Store Layout Optimizer",
  "Customer Sentiment Analyzer",
  "Vulnerability Prioritizer",
  "Training Recommendation Engine"
];

const EU_NON_COMPLIANT_NOTES = [
  "Conformity assessment not completed prior to deployment",
  "Human oversight mechanism not documented",
  "Bias testing not conducted on representative dataset",
  "No appeals process documented for automated decisions",
  "Technical documentation incomplete — missing system architecture diagram",
  "Data governance procedures not established for training data"
];

type AttestationStatus = "COMPLIANT" | "NON_COMPLIANT" | "PENDING" | "NOT_APPLICABLE";

function pickStatus<T>(arr: T[], index: number): T {
  return arr[index % arr.length];
}

export async function seedDemoEnterpriseP3(prisma: PrismaClient): Promise<void> {
  const org = await prisma.organization.findUnique({
    where: { slug: ORG_SLUG }
  });
  if (!org) {
    // eslint-disable-next-line no-console
    console.warn("Meridian Industrial org not found. Run demo-enterprise seed first.");
    return;
  }

  await seedFrameworks(prisma, org.id);

  const [frameworks, assets] = await Promise.all([
    prisma.complianceFramework.findMany({
      where: { orgId: org.id },
      include: { controls: true }
    }),
    prisma.aIAsset.findMany({
      where: { orgId: org.id, deletedAt: null },
      select: { id: true, name: true, euRiskLevel: true, autonomyLevel: true }
    })
  ]);

  const assetIdsByName = new Map(assets.map((a) => [a.name, a.id]));

  const priyaUser = await prisma.user.findFirst({
    where: { orgId: org.id, email: "priya.patel@meridian-industrial.com" },
    select: { id: true }
  });
  const attestedBy = priyaUser?.id ?? null;
  const sixMonthsFromNow = new Date();
  sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

  let attestationCount = 0;

  for (const fw of frameworks) {
    const frameworkCode = fw.code;
    for (const control of fw.controls) {
      for (const asset of assets) {
        const existing = await prisma.controlAttestation.findFirst({
          where: { controlId: control.id, assetId: asset.id }
        });
        if (existing) continue;

        let status: AttestationStatus;
        let evidenceRef: string | null = null;
        let notes: string | null = null;
        let nextReviewDate: Date | null = null;
        let attestedAt: Date | null = null;

        const assetName = asset.name;
        const isHigh = HIGH_RISK_ASSETS.includes(assetName);
        const isLimitedSample = LIMITED_SAMPLE_ASSETS.includes(assetName);
        const isMinimalSample = MINIMAL_SAMPLE_ASSETS.includes(assetName);
        const hash = (assetName.length + control.controlId.length) % 100;

        if (isHigh) {
          if (frameworkCode === "EU_AI_ACT") {
            const statuses: AttestationStatus[] = [
              "COMPLIANT",
              "COMPLIANT",
              "NON_COMPLIANT",
              "NON_COMPLIANT",
              "NON_COMPLIANT",
              "NON_COMPLIANT",
              "PENDING",
              "PENDING",
              "PENDING",
              "PENDING",
              "PENDING",
              "PENDING"
            ];
            status = pickStatus(statuses, hash + control.controlId.charCodeAt(0));
            if (status === "COMPLIANT") {
              evidenceRef = `SharePoint/AI-Governance/Evidence/${assetName.replace(/\s+/g, "-")}`;
              attestedAt = new Date();
              nextReviewDate = sixMonthsFromNow;
            }
            if (status === "NON_COMPLIANT") {
              notes = pickStatus(EU_NON_COMPLIANT_NOTES, hash);
            }
          } else if (frameworkCode === "NIST_AI_RMF") {
            const statuses: AttestationStatus[] = [
              "COMPLIANT",
              "COMPLIANT",
              "COMPLIANT",
              "NON_COMPLIANT",
              "NON_COMPLIANT",
              "PENDING"
            ];
            status = pickStatus(statuses, hash + parseInt(control.id.slice(-4), 16) || 0);
            if (status === "COMPLIANT") {
              evidenceRef = `SharePoint/AI-Governance/Evidence/${assetName.replace(/\s+/g, "-")}`;
              attestedAt = new Date();
            }
          } else {
            status = pickStatus(["COMPLIANT", "NON_COMPLIANT", "PENDING"] as AttestationStatus[], hash);
            if (status === "COMPLIANT") {
              evidenceRef = `SharePoint/AI-Governance/Evidence/${assetName.replace(/\s+/g, "-")}`;
              attestedAt = new Date();
            }
          }
        } else if (isLimitedSample) {
          if (frameworkCode === "NIST_AI_RMF") {
            status = pickStatus(
              ["COMPLIANT", "COMPLIANT", "COMPLIANT", "PENDING", "PENDING"] as AttestationStatus[],
              hash
            );
          } else if (frameworkCode === "COSAI_SRF") {
            status = pickStatus(
              ["COMPLIANT", "PENDING", "PENDING", "PENDING", "PENDING"] as AttestationStatus[],
              hash
            );
          } else if (frameworkCode === "EU_AI_ACT") {
            status = pickStatus(
              ["COMPLIANT", "COMPLIANT", "COMPLIANT", "COMPLIANT", "COMPLIANT", "COMPLIANT", "COMPLIANT", "PENDING", "PENDING", "NOT_APPLICABLE"] as AttestationStatus[],
              hash
            );
          } else {
            status = pickStatus(["COMPLIANT", "PENDING"] as AttestationStatus[], hash);
          }
          if (status === "COMPLIANT") {
            evidenceRef = `SharePoint/AI-Governance/Evidence/${assetName.replace(/\s+/g, "-")}`;
            attestedAt = new Date();
            nextReviewDate = sixMonthsFromNow;
          }
        } else if (isMinimalSample) {
          status = pickStatus(
            ["COMPLIANT", "COMPLIANT", "COMPLIANT", "COMPLIANT", "PENDING", "PENDING"] as AttestationStatus[],
            hash
          );
          if (status === "COMPLIANT") {
            evidenceRef = `SharePoint/AI-Governance/Evidence/${assetName.replace(/\s+/g, "-")}`;
            attestedAt = new Date();
            nextReviewDate = sixMonthsFromNow;
          }
        } else {
          status = pickStatus(["COMPLIANT", "PENDING", "PENDING"] as AttestationStatus[], hash);
          if (status === "COMPLIANT") {
            evidenceRef = `SharePoint/AI-Governance/Evidence/${assetName.replace(/\s+/g, "-")}`;
            attestedAt = new Date();
            nextReviewDate = sixMonthsFromNow;
          }
        }

        await prisma.controlAttestation.create({
          data: {
            controlId: control.id,
            assetId: asset.id,
            status,
            attestedBy,
            attestedAt,
            nextReviewDate,
            evidenceRef,
            notes
          }
        });
        attestationCount++;
      }
    }
  }

  const RACI_ASSIGNMENTS: Array<{
    assetName: string;
    componentName: string;
    cosaiLayer: "LAYER_1_BUSINESS" | "LAYER_2_INFORMATION" | "LAYER_3_APPLICATION" | "LAYER_4_PLATFORM" | "LAYER_5_SUPPLY_CHAIN";
    accountableParty: string;
    responsibleParty: string;
  }> = [
    { assetName: "Inventory Reorder Agent", componentName: "AI System", cosaiLayer: "LAYER_1_BUSINESS", accountableParty: "VP Operations", responsibleParty: "Business Owner" },
    { assetName: "Inventory Reorder Agent", componentName: "Training Data", cosaiLayer: "LAYER_2_INFORMATION", accountableParty: "Chief Data Officer", responsibleParty: "Data Engineering" },
    { assetName: "Inventory Reorder Agent", componentName: "AI Application", cosaiLayer: "LAYER_3_APPLICATION", accountableParty: "AI Product Manager", responsibleParty: "MLOps" },
    { assetName: "Inventory Reorder Agent", componentName: "Platform", cosaiLayer: "LAYER_4_PLATFORM", accountableParty: "CISO", responsibleParty: "IT Security Team" },
    { assetName: "Inventory Reorder Agent", componentName: "Model Provider", cosaiLayer: "LAYER_5_SUPPLY_CHAIN", accountableParty: "Procurement Lead", responsibleParty: "Supply Chain" },
    { assetName: "Log Analysis Agent", componentName: "Platform", cosaiLayer: "LAYER_4_PLATFORM", accountableParty: "CISO", responsibleParty: "IT Security Team" },
    { assetName: "Log Analysis Agent", componentName: "AI Application", cosaiLayer: "LAYER_3_APPLICATION", accountableParty: "AI Product Manager", responsibleParty: "MLOps" },
    { assetName: "Production Schedule Optimizer", componentName: "AI Application", cosaiLayer: "LAYER_3_APPLICATION", accountableParty: "VP Operations", responsibleParty: "Compliance Team" },
    { assetName: "Returns Classification Agent", componentName: "AI Application", cosaiLayer: "LAYER_3_APPLICATION", accountableParty: "Retail Division Lead", responsibleParty: "Compliance Team" }
  ];

  for (const raci of RACI_ASSIGNMENTS) {
    const assetId = assetIdsByName.get(raci.assetName);
    if (!assetId) continue;

    const existing = await prisma.accountabilityAssignment.findFirst({
      where: {
        assetId,
        componentName: raci.componentName,
        cosaiLayer: raci.cosaiLayer
      }
    });
    if (existing) continue;

    await prisma.accountabilityAssignment.create({
      data: {
        assetId,
        componentName: raci.componentName,
        cosaiLayer: raci.cosaiLayer,
        accountableParty: raci.accountableParty,
        responsibleParty: raci.responsibleParty,
        supportingParties: ["Legal", "Risk Management", "Business Owner"]
      }
    });
  }

  const jamesUser = await prisma.user.findFirst({
    where: { orgId: org.id, role: "ADMIN" },
    select: { id: true }
  });
  const setBy = jamesUser?.id ?? org.id;

  for (const flag of ["MODULE_SHADOW_AI", "MODULE_OPS_INTEL"] as const) {
    await prisma.featureFlag.upsert({
      where: {
        orgId_name: { orgId: org.id, name: flag }
      },
      create: {
        orgId: org.id,
        name: flag,
        enabled: true,
        setBy
      },
      update: { enabled: true, setBy }
    });
  }

  // eslint-disable-next-line no-console
  console.log(
    `Meridian P3 seeded: ${attestationCount} control attestations, ${RACI_ASSIGNMENTS.length} accountability assignments, 2 feature flags enabled.`
  );
}
