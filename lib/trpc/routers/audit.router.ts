import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { EVIDENCE_ITEMS, getEvidenceByLayer, type CosaiLayer } from "@/lib/audit/evidence-map";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const auditRouter = createTRPCRouter({
  getAuditPackagePreview: protectedProcedure
    .input(
      z.object({
        assetId: z.string().optional(),
        regulationCode: z.string().optional()
      }).refine((d) => d.assetId != null || d.regulationCode != null, {
        message: "Either assetId or regulationCode required"
      })
    )
    .query(async ({ ctx, input }) => {
      const orgId = ctx.orgId;
      const assetId = input.assetId;
      const regulationCode = input.regulationCode;

      const baseWhere = assetId ? { orgId, assetId } : { orgId };
      const assetWhere = assetId ? { orgId, id: assetId, deletedAt: null } : { orgId, deletedAt: null };

      const [
        controlAttestations,
        scanRecords,
        accountabilityAssignments,
        vendorAssurances,
        artifactCards,
        governancePolicies,
        maturityAssessment,
        lineageRecords,
        assetCount
      ] = await Promise.all([
        assetId
          ? prisma.controlAttestation.count({ where: { assetId } })
          : prisma.controlAttestation.count({
              where: { asset: { orgId } }
            }),
        assetId
          ? prisma.scanRecord.count({ where: { assetId } })
          : prisma.scanRecord.count({ where: { organization: { id: orgId } } }),
        assetId
          ? prisma.accountabilityAssignment.count({ where: { assetId } })
          : prisma.accountabilityAssignment.count({ where: { asset: { orgId } } }),
        prisma.vendorAssurance.count({ where: { orgId } }),
        assetId
          ? prisma.artifactCard.count({ where: { assetId } })
          : prisma.artifactCard.count({ where: { orgId } }),
        prisma.dataGovernancePolicy.count({ where: { orgId } }),
        prisma.maturityAssessment.findFirst({
          where: { orgId },
          orderBy: { createdAt: "desc" },
          select: { id: true }
        }),
        assetId
          ? prisma.dataLineageRecord.count({ where: { targetAssetId: assetId } })
          : prisma.dataLineageRecord.count({ where: { orgId } }),
        assetId ? 1 : prisma.aIAsset.count({ where: assetWhere })
      ]);

      const evidenceCounts = {
        controlAttestations,
        scanRecords,
        accountabilityAssignments,
        vendorAssurances,
        artifactCards,
        governancePolicies,
        maturityAssessment: maturityAssessment ? 1 : 0,
        lineageRecords
      };

      const modelCounts: Record<string, number> = {
        ControlAttestation: controlAttestations,
        ScanRecord: scanRecords,
        AccountabilityAssignment: accountabilityAssignments,
        VendorAssurance: vendorAssurances,
        ArtifactCard: artifactCards,
        DataGovernancePolicy: governancePolicies,
        MaturityAssessment: maturityAssessment ? 1 : 0,
        DataLineageRecord: lineageRecords,
        RiskRegister: 0,
        AuditLog: 1,
        ComplianceFramework: 1,
        Organization: 1,
        Assessment: 1,
        MasterDataEntity: 1,
        AIAsset: assetCount
      };

      const [riskCount, assessmentCount, frameworkCount] = await Promise.all([
        assetId
          ? prisma.riskRegister.count({ where: { assetId } })
          : prisma.riskRegister.count({ where: { organization: { id: orgId } } }),
        assetId
          ? prisma.assessment.count({ where: { assetId } })
          : prisma.assessment.count({ where: { organization: { id: orgId } } }),
        prisma.complianceFramework.count({ where: { orgId, isActive: true } })
      ]);
      modelCounts.RiskRegister = riskCount;
      modelCounts.Assessment = assessmentCount;
      modelCounts.ComplianceFramework = frameworkCount;

      const requiredItems = regulationCode
        ? EVIDENCE_ITEMS.filter((e) => e.requiredFor.includes(regulationCode))
        : EVIDENCE_ITEMS;
      const totalRequired = requiredItems.length;
      let presentCount = 0;
      const missingItems: { id: string; name: string; layer: string; howToCollect: string; link: string }[] = [];
      for (const item of requiredItems) {
        const count = modelCounts[item.prismaModel] ?? 0;
        if (count > 0) {
          presentCount++;
        } else {
          missingItems.push({
            id: item.id,
            name: item.name,
            layer: item.layer,
            howToCollect: item.howToCollect,
            link: getLinkForEvidence(item, assetId ?? undefined)
          });
        }
      }
      const coverageScore = totalRequired > 0 ? Math.round((presentCount / totalRequired) * 100) : 100;

      return {
        data: {
          evidenceCounts,
          coverageScore,
          totalRequired,
          presentCount,
          missingItems,
          assetCount
        },
        meta: {}
      };
    }),

  generateAuditPackage: protectedProcedure
    .input(
      z.object({
        assetId: z.string().optional(),
        regulationCode: z.string().optional()
      }).refine((d) => d.assetId != null || d.regulationCode != null, {
        message: "Either assetId or regulationCode required"
      })
    )
    .query(async ({ ctx, input }) => {
      const orgId = ctx.orgId;
      const assetId = input.assetId;

      const [
        assets,
        controlAttestations,
        scanRecords,
        accountabilityAssignments,
        vendorAssurances,
        artifactCards,
        governancePolicies,
        maturityAssessments,
        lineageRecords,
        riskRegisters
      ] = await Promise.all([
        prisma.aIAsset.findMany({
          where: assetId ? { id: assetId, orgId, deletedAt: null } : { orgId, deletedAt: null },
          include: { owner: { select: { email: true } } }
        }),
        prisma.controlAttestation.findMany({
          where: assetId ? { assetId } : { asset: { orgId } },
          include: { control: { select: { controlId: true, title: true } } }
        }),
        prisma.scanRecord.findMany({
          where: assetId ? { assetId } : { organization: { id: orgId } }
        }),
        prisma.accountabilityAssignment.findMany({
          where: assetId ? { assetId } : { asset: { orgId } }
        }),
        prisma.vendorAssurance.findMany({ where: { orgId } }),
        prisma.artifactCard.findMany({
          where: assetId ? { assetId } : { orgId }
        }),
        prisma.dataGovernancePolicy.findMany({ where: { orgId } }),
        prisma.maturityAssessment.findMany({ where: { orgId }, orderBy: { createdAt: "desc" }, take: 1 }),
        prisma.dataLineageRecord.findMany({
          where: assetId ? { targetAssetId: assetId } : { orgId }
        }),
        prisma.riskRegister.findMany({
          where: assetId ? { assetId } : { organization: { id: orgId } }
        })
      ]);

      const packageData = {
        generatedAt: new Date().toISOString(),
        orgId,
        assetId: assetId ?? "all",
        regulationCode: input.regulationCode ?? "all",
        evidence: {
          assets: assets.map((a) => ({
            id: a.id,
            name: a.name,
            assetType: a.assetType,
            euRiskLevel: a.euRiskLevel,
            owner: a.owner?.email
          })),
          controlAttestations: controlAttestations.map((c) => ({
            controlId: c.control.controlId,
            title: c.control.title,
            status: c.status,
            attestedAt: c.attestedAt
          })),
          scanRecords: scanRecords.map((s) => ({
            scannerName: s.scannerName,
            scanType: s.scanType,
            status: s.status,
            completedAt: s.completedAt
          })),
          accountabilityAssignments,
          vendorAssurances: vendorAssurances.map((v) => ({
            vendorName: v.vendorName,
            soc2Status: v.soc2Status,
            slsaLevel: v.slsaLevel
          })),
          artifactCards: artifactCards.map((a) => ({
            cardType: a.cardType,
            importedAt: a.importedAt
          })),
          governancePolicies: governancePolicies.map((g) => ({
            name: g.name,
            policyType: g.policyType,
            status: g.status
          })),
          maturityAssessments,
          lineageRecords: lineageRecords.map((l) => ({
            name: l.name,
            pipelineType: l.pipelineType
          })),
          riskRegisters: riskRegisters.map((r) => ({
            title: r.title,
            status: r.status
          }))
        }
      };

      return { data: packageData, meta: {} };
    }),

  getEvidenceWorkbook: protectedProcedure
    .input(z.object({ layer: z.enum(["L1", "L2", "L3", "L4", "L5"]).optional() }))
    .query(async ({ ctx, input }) => {
      const orgId = ctx.orgId;
      const items = getEvidenceByLayer(input.layer as CosaiLayer | undefined);

      const [
        controlAttestationCount,
        scanRecordCount,
        accountabilityCount,
        vendorCount,
        artifactCount,
        policyCount,
        maturityCount,
        lineageCount,
        riskCount,
        assessmentCount,
        masterDataCount,
        assetCount
      ] = await Promise.all([
        prisma.controlAttestation.count({ where: { asset: { orgId } } }),
        prisma.scanRecord.count({ where: { organization: { id: orgId } } }),
        prisma.accountabilityAssignment.count({ where: { asset: { orgId } } }),
        prisma.vendorAssurance.count({ where: { orgId } }),
        prisma.artifactCard.count({ where: { orgId } }),
        prisma.dataGovernancePolicy.count({ where: { orgId } }),
        prisma.maturityAssessment.count({ where: { orgId } }),
        prisma.dataLineageRecord.count({ where: { orgId } }),
        prisma.riskRegister.count({ where: { organization: { id: orgId } } }),
        prisma.assessment.count({ where: { organization: { id: orgId } } }),
        prisma.masterDataEntity.count({ where: { orgId } }),
        prisma.aIAsset.count({ where: { orgId, deletedAt: null } })
      ]);

      const modelCounts: Record<string, number> = {
        ControlAttestation: controlAttestationCount,
        ScanRecord: scanRecordCount,
        AccountabilityAssignment: accountabilityCount,
        VendorAssurance: vendorCount,
        ArtifactCard: artifactCount,
        DataGovernancePolicy: policyCount,
        MaturityAssessment: maturityCount,
        DataLineageRecord: lineageCount,
        RiskRegister: riskCount,
        Assessment: assessmentCount,
        MasterDataEntity: masterDataCount,
        AIAsset: assetCount
      };

      const [auditCount, frameworkCount] = await Promise.all([
        prisma.auditLog.count({ where: { orgId } }),
        prisma.complianceFramework.count({ where: { orgId, isActive: true } })
      ]);
      modelCounts.AuditLog = auditCount > 0 ? 1 : 0;
      modelCounts.ComplianceFramework = frameworkCount;

      const workbookItems = items.map((item) => {
        const count = modelCounts[item.prismaModel] ?? 0;
        const status: "present" | "missing" | "partial" = count > 0 ? "present" : "missing";

        return {
          ...item,
          status,
          count,
          lastUpdated: null as Date | null,
          link: getLinkForEvidence(item, undefined)
        };
      });

      return { data: workbookItems, meta: {} };
    }),

  getEvidenceCompleteness: protectedProcedure.query(async ({ ctx }) => {
    const orgId = ctx.orgId;
    const layers = ["L1", "L2", "L3", "L4", "L5"] as const;

    const [
      controlAttestationCount,
      scanRecordCount,
      accountabilityCount,
      vendorCount,
      artifactCount,
      policyCount,
      maturityCount,
      lineageCount,
      riskCount,
      assessmentCount,
      masterDataCount,
      assetCount,
      auditCount,
      frameworkCount,
      org
    ] = await Promise.all([
      prisma.controlAttestation.count({ where: { asset: { orgId } } }),
      prisma.scanRecord.count({ where: { organization: { id: orgId } } }),
      prisma.accountabilityAssignment.count({ where: { asset: { orgId } } }),
      prisma.vendorAssurance.count({ where: { orgId } }),
      prisma.artifactCard.count({ where: { orgId } }),
      prisma.dataGovernancePolicy.count({ where: { orgId } }),
      prisma.maturityAssessment.count({ where: { orgId } }),
      prisma.dataLineageRecord.count({ where: { orgId } }),
      prisma.riskRegister.count({ where: { organization: { id: orgId } } }),
      prisma.assessment.count({ where: { organization: { id: orgId } } }),
      prisma.masterDataEntity.count({ where: { orgId } }),
      prisma.aIAsset.count({ where: { orgId, deletedAt: null } }),
      prisma.auditLog.count({ where: { orgId } }),
      prisma.complianceFramework.count({ where: { orgId, isActive: true } }),
      prisma.organization.findUnique({ where: { id: orgId }, select: { id: true } })
    ]);

    const modelCounts: Record<string, number> = {
      ControlAttestation: controlAttestationCount,
      ScanRecord: scanRecordCount,
      AccountabilityAssignment: accountabilityCount,
      VendorAssurance: vendorCount,
      ArtifactCard: artifactCount,
      DataGovernancePolicy: policyCount,
      MaturityAssessment: maturityCount,
      DataLineageRecord: lineageCount,
      RiskRegister: riskCount,
      Assessment: assessmentCount,
      MasterDataEntity: masterDataCount,
      AIAsset: assetCount,
      AuditLog: auditCount > 0 ? 1 : 0,
      ComplianceFramework: frameworkCount,
      Organization: org ? 1 : 0
    };

    const byLayer: Record<string, { complete: number; total: number; pct: number }> = {};
    for (const layer of layers) {
      const layerItems = EVIDENCE_ITEMS.filter((e) => e.layer === layer);
      let complete = 0;
      for (const item of layerItems) {
        const count = modelCounts[item.prismaModel] ?? 0;
        if (count > 0 || (item.prismaModel === "Organization" && org)) complete++;
      }
      byLayer[layer] = {
        complete,
        total: layerItems.length,
        pct: layerItems.length > 0 ? Math.round((complete / layerItems.length) * 100) : 100
      };
    }

    const totalItems = EVIDENCE_ITEMS.length;
    const totalComplete = Object.values(byLayer).reduce((a, b) => a + b.complete, 0);
    const overallPct = totalItems > 0 ? Math.round((totalComplete / totalItems) * 100) : 100;

    return {
      data: { byLayer, overallPct, totalComplete, totalItems },
      meta: {}
    };
  }),

  takeSnapshot: protectedProcedure
    .input(
      z.object({
        frameworkCode: z.string().optional(),
        notes: z.string().optional(),
        snapshotType: z.enum(["MANUAL", "SCHEDULED", "PRE_AUDIT"]).optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.orgId;
      const userId = ctx.userId;
      const snapshotData = await computeSnapshotData(prisma, orgId, input.frameworkCode);
      const snapshot = await prisma.complianceSnapshot.create({
        data: {
          orgId,
          createdBy: userId ?? undefined,
          snapshotType: input.snapshotType ?? "MANUAL",
          frameworkCode: input.frameworkCode ?? null,
          overallScore: snapshotData.overallScore,
          layerScores: snapshotData.layerScores as object,
          assetCount: snapshotData.assetCount,
          controlsCompliant: snapshotData.controlsCompliant,
          controlsTotal: snapshotData.controlsTotal,
          gapCount: snapshotData.gapCount,
          evidenceCompleteness: snapshotData.evidenceCompleteness,
          notes: input.notes ?? null
        },
        include: { creator: { select: { email: true } } }
      });
      return { data: snapshot, meta: {} };
    }),

  getSnapshots: protectedProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const snapshots = await prisma.complianceSnapshot.findMany({
        where: { orgId: ctx.orgId },
        orderBy: { createdAt: "desc" },
        take: input?.limit,
        include: { creator: { select: { email: true } } }
      });
      return { data: snapshots, meta: {} };
    }),

  getSnapshot: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const snapshot = await prisma.complianceSnapshot.findFirst({
        where: { id: input.id, orgId: ctx.orgId },
        include: { creator: { select: { email: true } } }
      });
      if (!snapshot) return { data: null, meta: {} };
      return { data: snapshot, meta: {} };
    }),

  compareSnapshots: protectedProcedure
    .input(z.object({ id1: z.string(), id2: z.string() }))
    .query(async ({ ctx, input }) => {
      const [s1, s2] = await Promise.all([
        prisma.complianceSnapshot.findFirst({
          where: { id: input.id1, orgId: ctx.orgId }
        }),
        prisma.complianceSnapshot.findFirst({
          where: { id: input.id2, orgId: ctx.orgId }
        })
      ]);
      if (!s1 || !s2) return { data: null, meta: {} };
      const layerScores1 = (s1.layerScores ?? {}) as Record<string, number>;
      const layerScores2 = (s2.layerScores ?? {}) as Record<string, number>;
      const layers = ["L1", "L2", "L3", "L4", "L5"];
      const layerDiff = layers.map((l) => ({
        layer: l,
        score1: layerScores1[l] ?? 0,
        score2: layerScores2[l] ?? 0,
        delta: (layerScores2[l] ?? 0) - (layerScores1[l] ?? 0)
      }));
      return {
        data: {
          snapshot1: { id: s1.id, createdAt: s1.createdAt, overallScore: s1.overallScore, gapCount: s1.gapCount, assetCount: s1.assetCount },
          snapshot2: { id: s2.id, createdAt: s2.createdAt, overallScore: s2.overallScore, gapCount: s2.gapCount, assetCount: s2.assetCount },
          overallDelta: s2.overallScore - s1.overallScore,
          gapCountDelta: s2.gapCount - s1.gapCount,
          assetCountDelta: s2.assetCount - s1.assetCount,
          evidenceCompletenessDelta: s2.evidenceCompleteness - s1.evidenceCompleteness,
          layerDiff
        },
        meta: {}
      };
    })
});

async function computeSnapshotData(
  prisma: import("@prisma/client").PrismaClient,
  orgId: string,
  frameworkCode?: string
) {
  const { calculateKPI } = await import("@/lib/value/kpi-engine");
  const assets = await prisma.aIAsset.findMany({
    where: { orgId, deletedAt: null },
    select: { id: true }
  });
  const assetCount = assets.length;

  const [complianceScore, evidenceData, topGaps] = await Promise.all([
    calculateKPI("COMPLIANCE_SCORE", { orgId, prisma }),
    (async () => {
      const layers = ["L1", "L2", "L3", "L4", "L5"] as const;
      const [
        controlAttestationCount,
        scanRecordCount,
        accountabilityCount,
        vendorCount,
        artifactCount,
        policyCount,
        maturityCount,
        lineageCount,
        riskCount,
        assessmentCount,
        masterDataCount,
        auditCount,
        frameworkCount,
        org
      ] = await Promise.all([
        prisma.controlAttestation.count({ where: { asset: { orgId } } }),
        prisma.scanRecord.count({ where: { organization: { id: orgId } } }),
        prisma.accountabilityAssignment.count({ where: { asset: { orgId } } }),
        prisma.vendorAssurance.count({ where: { orgId } }),
        prisma.artifactCard.count({ where: { orgId } }),
        prisma.dataGovernancePolicy.count({ where: { orgId } }),
        prisma.maturityAssessment.count({ where: { orgId } }),
        prisma.dataLineageRecord.count({ where: { orgId } }),
        prisma.riskRegister.count({ where: { organization: { id: orgId } } }),
        prisma.assessment.count({ where: { organization: { id: orgId } } }),
        prisma.masterDataEntity.count({ where: { orgId } }),
        prisma.auditLog.count({ where: { orgId } }),
        prisma.complianceFramework.count({ where: { orgId, isActive: true } }),
        prisma.organization.findUnique({ where: { id: orgId }, select: { id: true } })
      ]);
      const modelCounts: Record<string, number> = {
        ControlAttestation: controlAttestationCount,
        ScanRecord: scanRecordCount,
        AccountabilityAssignment: accountabilityCount,
        VendorAssurance: vendorCount,
        ArtifactCard: artifactCount,
        DataGovernancePolicy: policyCount,
        MaturityAssessment: maturityCount,
        DataLineageRecord: lineageCount,
        RiskRegister: riskCount,
        Assessment: assessmentCount,
        MasterDataEntity: masterDataCount,
        AIAsset: assetCount,
        AuditLog: auditCount > 0 ? 1 : 0,
        ComplianceFramework: frameworkCount,
        Organization: org ? 1 : 0
      };
      const byLayer: Record<string, number> = {};
      let totalComplete = 0;
      for (const layer of layers) {
        const layerItems = EVIDENCE_ITEMS.filter((e) => e.layer === layer);
        let complete = 0;
        for (const item of layerItems) {
          const count = modelCounts[item.prismaModel] ?? 0;
          if (count > 0 || (item.prismaModel === "Organization" && org)) complete++;
        }
        totalComplete += complete;
        byLayer[layer] = layerItems.length > 0 ? Math.round((complete / layerItems.length) * 100) : 100;
      }
      const totalItems = EVIDENCE_ITEMS.length;
      const overallPct = totalItems > 0 ? Math.round((totalComplete / totalItems) * 100) : 100;
      return { byLayer, overallPct };
    })(),
    (async () => {
      const engine = await import("@/lib/compliance/engine");
      const allGaps: { controlId: string }[] = [];
      for (const a of assets) {
        const report = await engine.getGapAnalysis(prisma, a.id);
        for (const g of report.criticalGaps) {
          allGaps.push({ controlId: g.controlId });
        }
      }
      return allGaps;
    })()
  ]);

  const gapCount = topGaps.length;
  const layerScores = evidenceData.byLayer;

  const frameworks = await prisma.complianceFramework.findMany({
    where: {
      orgId,
      isActive: true,
      ...(frameworkCode ? { code: frameworkCode as "NIST_AI_RMF" | "EU_AI_ACT" | "COSAI_SRF" | "NIST_CSF" | "ISO_42001" | "CUSTOM" } : {})
    },
    select: { id: true }
  });
  let controlsTotal = 0;
  let controlsCompliant = 0;
  if (frameworks.length > 0) {
    const controlIds = await prisma.control.findMany({
      where: { frameworkId: { in: frameworks.map((f) => f.id) } },
      select: { id: true }
    });
    controlsTotal = controlIds.length * Math.max(1, assets.length);
    for (const a of assets) {
      const engine = await import("@/lib/compliance/engine");
      const r = await engine.calculateComplianceScore(prisma, a.id);
      controlsCompliant += r.score;
    }
  }

  return {
    overallScore: complianceScore,
    layerScores: evidenceData.byLayer,
    assetCount,
    controlsCompliant,
    controlsTotal: controlsTotal || 1,
    gapCount,
    evidenceCompleteness: evidenceData.overallPct
  };
}

function getLinkForEvidence(
  item: { id: string; layer: string; prismaModel: string },
  assetId?: string
): string {
  const base = "/";
  switch (item.prismaModel) {
    case "ControlAttestation":
    case "AccountabilityAssignment":
      return assetId ? `/layer3-application/assets/${assetId}` : "/layer3-application/accountability";
    case "ScanRecord":
      return "/layer5-supply-chain/scanning";
    case "VendorAssurance":
      return "/layer5-supply-chain/vendors";
    case "ArtifactCard":
      return "/layer5-supply-chain/cards";
    case "DataGovernancePolicy":
      return "/layer2-information/governance";
    case "MaturityAssessment":
      return "/maturity";
    case "DataLineageRecord":
      return "/layer2-information/lineage";
    case "RiskRegister":
      return "/layer3-application/assets";
    case "ComplianceFramework":
      return "/layer1-business/regulatory-cascade";
    case "AuditLog":
      return "/audit";
    case "Organization":
      return "/settings";
    case "MasterDataEntity":
      return "/layer2-information/master-data";
    case "Assessment":
      return "/assessments";
    default:
      return "/";
  }
}
