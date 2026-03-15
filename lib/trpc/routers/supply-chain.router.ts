import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { prisma } from "@/lib/prisma";
import { assessVendorPosture, checkEvidenceCurrency } from "@/lib/supply-chain/assurance";
import {
  getScanCoverage,
  getScanPolicy as getScanPolicyForAsset,
  checkScanCompliance
} from "@/lib/scanning/coverage";
import { mapCardToEURequirements } from "@/lib/cards/eu-ai-act-mapper";
import type { NormalizedCard } from "@/lib/cards/normalizer";
import { normalizeCard } from "@/lib/cards/normalizer";
import { fetchModelCard, fetchDatasetCard } from "@/lib/cards/importers/huggingface";
import { fetchRepoCards } from "@/lib/cards/importers/github";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const supplyChainRouter = createTRPCRouter({
  getAssets: protectedProcedure.query(async ({ ctx }) => {
    const list = await prisma.aIAsset.findMany({
      where: { orgId: ctx.orgId, deletedAt: null },
      select: { id: true, name: true }
    });
    return { data: list, meta: {} };
  }),

  getCards: protectedProcedure
    .input(z.object({ assetId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const where = input?.assetId
        ? { orgId: ctx.orgId, assetId: input.assetId }
        : { orgId: ctx.orgId };
      const list = await prisma.artifactCard.findMany({
        where,
        include: { asset: { select: { id: true, name: true, euRiskLevel: true } } }
      });
      return { data: list, meta: {} };
    }),

  getCard: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const card = await prisma.artifactCard.findFirst({
        where: { id: input.id, orgId: ctx.orgId },
        include: { asset: { select: { id: true, name: true, euRiskLevel: true } } }
      });
      if (!card) throw new TRPCError({ code: "NOT_FOUND", message: "Card not found" });
      return { data: card, meta: {} };
    }),

  getCardEUCoverage: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const card = await prisma.artifactCard.findFirst({
        where: { id: input.id, orgId: ctx.orgId },
        include: { asset: { select: { euRiskLevel: true } } }
      });
      if (!card) throw new TRPCError({ code: "NOT_FOUND", message: "Card not found" });
      const normalized = card.normalizedContent as NormalizedCard | null;
      if (!normalized) return { data: [], meta: {} };
      const coverage = mapCardToEURequirements(normalized, card.asset.euRiskLevel);
      return { data: coverage, meta: {} };
    }),

  getVendors: protectedProcedure.query(async ({ ctx }) => {
    const list = await prisma.vendorAssurance.findMany({
      where: { orgId: ctx.orgId }
    });
    const withScores = await Promise.all(
      list.map(async (v) => {
        const score = await assessVendorPosture(prisma, ctx.orgId, v.id);
        const expired = await checkEvidenceCurrency(prisma, ctx.orgId, v.id);
        return { ...v, assuranceScore: score, expiredEvidence: expired };
      })
    );
    return { data: withScores, meta: {} };
  }),

  getVendor: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const vendor = await prisma.vendorAssurance.findFirst({
        where: { id: input.id, orgId: ctx.orgId }
      });
      if (!vendor) throw new TRPCError({ code: "NOT_FOUND", message: "Vendor not found" });
      const [assuranceScore, expiredEvidence] = await Promise.all([
        assessVendorPosture(prisma, ctx.orgId, vendor.id),
        checkEvidenceCurrency(prisma, ctx.orgId, vendor.id)
      ]);
      return { data: { ...vendor, assuranceScore, expiredEvidence }, meta: {} };
    }),

  getScanCoverage: protectedProcedure.query(async ({ ctx }) => {
    const matrix = await getScanCoverage(prisma, ctx.orgId);
    return { data: matrix, meta: {} };
  }),

  getScanPolicy: protectedProcedure
    .input(z.object({ assetId: z.string() }))
    .query(async ({ ctx, input }) => {
      const asset = await prisma.aIAsset.findFirst({
        where: { id: input.assetId, orgId: ctx.orgId, deletedAt: null }
      });
      if (!asset) throw new TRPCError({ code: "NOT_FOUND", message: "Asset not found" });
      const policy = await getScanPolicyForAsset(prisma, input.assetId);
      return { data: policy, meta: {} };
    }),

  getScanCompliance: protectedProcedure
    .input(z.object({ assetId: z.string() }))
    .query(async ({ ctx, input }) => {
      const asset = await prisma.aIAsset.findFirst({
        where: { id: input.assetId, orgId: ctx.orgId, deletedAt: null }
      });
      if (!asset) throw new TRPCError({ code: "NOT_FOUND", message: "Asset not found" });
      const result = await checkScanCompliance(prisma, input.assetId);
      return { data: result, meta: {} };
    }),

  importCard: protectedProcedure
    .input(
      z.object({
        assetId: z.string(),
        source: z.string().min(1),
        type: z.enum(["HUGGINGFACE_MODEL", "HUGGINGFACE_DATASET", "GITHUB"])
      })
    )
    .mutation(async ({ ctx, input }) => {
      const asset = await prisma.aIAsset.findFirst({
        where: { id: input.assetId, orgId: ctx.orgId, deletedAt: null }
      });
      if (!asset) throw new TRPCError({ code: "NOT_FOUND", message: "Asset not found" });

      let raw: Record<string, unknown>;
      let cardType: "MODEL_CARD" | "DATA_CARD" | "APP_CARD" = "MODEL_CARD";
      let sourceRepo: string | null = null;
      let sourceFormat: "REPO" | "API" | "MANUAL" | "IMPORT" = "API";

      if (input.type === "HUGGINGFACE_MODEL") {
        raw = await fetchModelCard(input.source);
        sourceRepo = `https://huggingface.co/${input.source}`;
        sourceFormat = "API";
      } else if (input.type === "HUGGINGFACE_DATASET") {
        raw = await fetchDatasetCard(input.source);
        sourceRepo = `https://huggingface.co/datasets/${input.source}`;
        sourceFormat = "API";
      } else {
        const cards = await fetchRepoCards(input.source);
        if (cards.length === 0) throw new TRPCError({ code: "BAD_REQUEST", message: "No cards found in repo" });
        const first = cards[0];
        raw = { content: first.content, markdown: first.content };
        sourceRepo = input.source;
        sourceFormat = "REPO";
        cardType = first.type === "MODEL_CARD" ? "MODEL_CARD" : first.type === "DATASHEET" ? "DATA_CARD" : "APP_CARD";
      }

      const normalized = normalizeCard(raw, input.type === "GITHUB" ? "GITHUB" : "HUGGINGFACE");
      const contentHash = JSON.stringify(normalized).substring(0, 64);

      const card = await prisma.artifactCard.create({
        data: {
          orgId: ctx.orgId,
          assetId: input.assetId,
          cardType,
          sourceRepo,
          sourceFormat,
          rawContent: raw as object,
          normalizedContent: normalized as object,
          contentHash,
          syncStatus: "SYNCED",
          lastSyncedAt: new Date()
        }
      });

      return { data: card, meta: {} };
    }),

  getOverview: protectedProcedure.query(async ({ ctx }) => {
    const [cards, vendors, coverage] = await Promise.all([
      prisma.artifactCard.findMany({ where: { orgId: ctx.orgId } }),
      prisma.vendorAssurance.findMany({ where: { orgId: ctx.orgId } }),
      getScanCoverage(prisma, ctx.orgId)
    ]);

    const staleCards = cards.filter((c) => {
      if (!c.lastSyncedAt) return true;
      const days = (Date.now() - c.lastSyncedAt.getTime()) / 86400000;
      return days > 30;
    });

    let policyPassPct = 0;
    if (coverage.assets.length > 0) {
      let total = 0;
      let passed = 0;
      for (const row of coverage.assets) {
        const result = await checkScanCompliance(prisma, row.assetId);
        total += result.required.length;
        passed += result.passed.length;
      }
      policyPassPct = total > 0 ? Math.round((passed / total) * 100) : 100;
    }

    return {
      data: {
        cardCount: cards.length,
        staleCardCount: staleCards.length,
        vendorCount: vendors.length,
        scanPolicyPassPct: policyPassPct,
        coverage
      },
      meta: {}
    };
  }),

  getTopologyData: protectedProcedure.query(async ({ ctx }) => {
    const orgId = ctx.orgId;
    const [org, masterData, assets, lineage, vendors, scanRecords] = await Promise.all([
      prisma.organization.findUnique({
        where: { id: orgId },
        select: { id: true, name: true }
      }),
      prisma.masterDataEntity.findMany({
        where: { orgId },
        select: { id: true, name: true, entityType: true, recordCount: true }
      }),
      prisma.aIAsset.findMany({
        where: { orgId, deletedAt: null },
        select: { id: true, name: true, assetType: true, euRiskLevel: true }
      }),
      prisma.dataLineageRecord.findMany({
        where: { orgId },
        select: { sourceEntityId: true, targetAssetId: true }
      }),
      prisma.vendorAssurance.findMany({
        where: { orgId },
        select: { id: true, vendorName: true, vendorType: true, cosaiLayer: true }
      }),
      prisma.scanRecord.findMany({
        where: { orgId },
        select: { assetId: true }
      })
    ]);

    type TopologyNode = {
      id: string;
      label: string;
      layer: "L1" | "L2" | "L3" | "L4" | "L5";
      role: string;
      link?: string;
      recordCount?: number;
      euRiskLevel?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
      assetType?: string;
    };
    type TopologyEdge = { from: string; to: string; type: "lineage" | "platform" | "model" | "governance" };

    function mapEuRiskToTopology(
      level: string | null | undefined
    ): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | undefined {
      if (!level) return undefined;
      const map: Record<string, "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"> = {
        MINIMAL: "LOW",
        LIMITED: "MEDIUM",
        HIGH: "HIGH",
        UNACCEPTABLE: "CRITICAL"
      };
      return map[level];
    }

    const nodes: TopologyNode[] = [];
    const edges: TopologyEdge[] = [];

    if (org) {
      nodes.push({
        id: `org-${org.id}`,
        label: org.name,
        layer: "L1",
        role: "Organization",
        link: "/settings/organization"
      });
    }

    for (const m of masterData) {
      nodes.push({
        id: `mde-${m.id}`,
        label: m.name,
        layer: "L2",
        role: String(m.entityType),
        link: "/layer2-information/master-data",
        recordCount: m.recordCount ?? undefined
      });
    }

    for (const a of assets) {
      nodes.push({
        id: `asset-${a.id}`,
        label: a.name,
        layer: "L3",
        role: String(a.assetType),
        link: `/layer3-application/assets/${a.id}`,
        euRiskLevel: mapEuRiskToTopology(a.euRiskLevel),
        assetType: String(a.assetType)
      });
    }

    const l4Vendors = vendors.filter(
      (v) =>
        v.vendorType === "INFRASTRUCTURE" ||
        v.vendorType === "TOOLING" ||
        v.cosaiLayer === "LAYER_4_PLATFORM"
    );
    const l5Vendors = vendors.filter(
      (v) =>
        v.vendorType === "MODEL_PROVIDER" ||
        v.vendorType === "DATA_PROVIDER" ||
        v.cosaiLayer === "LAYER_5_SUPPLY_CHAIN"
    );
    const otherVendors = vendors.filter(
      (v) =>
        !l4Vendors.some((l4) => l4.id === v.id) && !l5Vendors.some((l5) => l5.id === v.id)
    );
    const assigned = new Set<string>();
    for (const v of l4Vendors) {
      if (assigned.has(v.id)) continue;
      assigned.add(v.id);
      nodes.push({
        id: `vendor-${v.id}`,
        label: v.vendorName,
        layer: "L4",
        role: "Platform",
        link: `/layer5-supply-chain/vendors/${v.id}`
      });
    }
    for (const v of l5Vendors) {
      if (assigned.has(v.id)) continue;
      assigned.add(v.id);
      nodes.push({
        id: `vendor-${v.id}`,
        label: v.vendorName,
        layer: "L5",
        role: "Model Provider",
        link: `/layer5-supply-chain/vendors/${v.id}`
      });
    }
    for (const v of otherVendors) {
      if (assigned.has(v.id)) continue;
      assigned.add(v.id);
      nodes.push({
        id: `vendor-${v.id}`,
        label: v.vendorName,
        layer: "L5",
        role: "Vendor",
        link: `/layer5-supply-chain/vendors/${v.id}`
      });
    }

    const seenEdges = new Set<string>();
    for (const l of lineage) {
      if (l.sourceEntityId && l.targetAssetId) {
        const key = `mde-${l.sourceEntityId}-asset-${l.targetAssetId}`;
        if (!seenEdges.has(key)) {
          seenEdges.add(key);
          edges.push({
            from: `mde-${l.sourceEntityId}`,
            to: `asset-${l.targetAssetId}`,
            type: "lineage"
          });
        }
      }
    }

    if (org) {
      for (const a of assets.slice(0, 5)) {
        const key = `org-${org.id}-asset-${a.id}`;
        if (!seenEdges.has(key)) {
          seenEdges.add(key);
          edges.push({ from: `org-${org.id}`, to: `asset-${a.id}`, type: "governance" });
        }
      }
    }

    const assetsWithScans = new Set(scanRecords.map((s) => s.assetId));
    for (const a of assets) {
      if (!assetsWithScans.has(a.id)) continue;
      for (const v of l4Vendors.slice(0, 2)) {
        const key = `asset-${a.id}-vendor-${v.id}`;
        if (!seenEdges.has(key)) {
          seenEdges.add(key);
          edges.push({ from: `asset-${a.id}`, to: `vendor-${v.id}`, type: "platform" });
        }
      }
    }

    for (const l4 of l4Vendors) {
      for (const l5 of l5Vendors.slice(0, 2)) {
        const key = `vendor-${l4.id}-vendor-${l5.id}`;
        if (!seenEdges.has(key)) {
          seenEdges.add(key);
          edges.push({ from: `vendor-${l4.id}`, to: `vendor-${l5.id}`, type: "model" });
        }
      }
    }

    const byLayer: Record<string, number> = { L1: 0, L2: 0, L3: 0, L4: 0, L5: 0 };
    for (const n of nodes) byLayer[n.layer] = (byLayer[n.layer] ?? 0) + 1;

    return { data: { nodes, edges, byLayer }, meta: {} };
  }),

  getProvenanceRecords: protectedProcedure
    .input(z.object({ vendorId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const where = { orgId: ctx.orgId, ...(input?.vendorId && { vendorId: input.vendorId }) };
      const records = await prisma.provenanceRecord.findMany({
        where,
        orderBy: [{ vendorId: "asc" }, { createdAt: "asc" }],
        include: { vendor: { select: { vendorName: true } } }
      });
      return { data: records, meta: {} };
    }),

  addProvenanceRecord: protectedProcedure
    .input(
      z.object({
        vendorId: z.string(),
        modelName: z.string(),
        stepType: z.enum(["TRAINING_DATA", "BASE_MODEL", "FINE_TUNING", "DEPLOYMENT"]),
        description: z.string().optional(),
        responsibleParty: z.string().optional(),
        attestation: z.boolean().optional(),
        attestationDetails: z.string().optional(),
        occurredAt: z.coerce.date().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const vendor = await prisma.vendorAssurance.findFirst({
        where: { id: input.vendorId, orgId: ctx.orgId }
      });
      if (!vendor) throw new TRPCError({ code: "NOT_FOUND", message: "Vendor not found" });
      const record = await prisma.provenanceRecord.create({
        data: {
          orgId: ctx.orgId,
          vendorId: input.vendorId,
          modelName: input.modelName,
          stepType: input.stepType,
          description: input.description ?? null,
          responsibleParty: input.responsibleParty ?? null,
          attestation: input.attestation ?? false,
          attestationDetails: input.attestationDetails ?? null,
          occurredAt: input.occurredAt ?? null
        }
      });
      return { data: record, meta: {} };
    }),

  getSupplyChainRiskScores: protectedProcedure.query(async ({ ctx }) => {
    const orgId = ctx.orgId;
    const vendors = await prisma.vendorAssurance.findMany({
      where: { orgId },
      include: {
        _count: { select: { provenanceRecords: true } }
      }
    });

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const cards = await prisma.artifactCard.findMany({
      where: { orgId },
      select: { assetId: true }
    });
    const assetIdsWithCards = [...new Set(cards.map((c) => c.assetId))];
    const existingAssets = await prisma.aIAsset.findMany({
      where: { id: { in: assetIdsWithCards }, orgId, deletedAt: null },
      select: { id: true }
    });
    const modelAssetIds = existingAssets.map((a) => a.id);

    const scannedIn90Days = new Set<string>();
    if (modelAssetIds.length > 0) {
      const recentScans = await prisma.scanRecord.findMany({
        where: {
          orgId,
          assetId: { in: modelAssetIds },
          OR: [
            { completedAt: { gte: ninetyDaysAgo } },
            { completedAt: null, startedAt: { gte: ninetyDaysAgo } }
          ]
        },
        select: { assetId: true }
      });
      for (const r of recentScans) scannedIn90Days.add(r.assetId);
    }
    const orgScanCoveragePct =
      modelAssetIds.length > 0
        ? Math.round((scannedIn90Days.size / modelAssetIds.length) * 100)
        : 0;

    const scores = await Promise.all(
      vendors.map(async (v) => {
        const [assurance, expired] = await Promise.all([
          assessVendorPosture(prisma, orgId, v.id),
          checkEvidenceCurrency(prisma, orgId, v.id)
        ]);

        const evidenceRecords: { current: boolean }[] = [];
        if (v.soc2Status === "CERTIFIED") {
          evidenceRecords.push({
            current: !v.soc2ExpiresAt || v.soc2ExpiresAt > new Date()
          });
        }
        if (v.lastReviewedAt) {
          evidenceRecords.push({
            current: v.lastReviewedAt >= twelveMonthsAgo
          });
        }
        const evidenceCurrency =
          evidenceRecords.length > 0
            ? Math.round(
                (evidenceRecords.filter((r) => r.current).length / evidenceRecords.length) * 100
              )
            : 0;

        const scanCoverage = orgScanCoveragePct;

        const contractAlignment = v.contractAligned ? 100 : 0;
        const overall =
          Math.round(
            assurance.total * 30 +
              evidenceCurrency * 0.25 +
              contractAlignment * 0.2 +
              scanCoverage * 0.25
          ) || 0;
        return {
          vendorId: v.id,
          vendorName: v.vendorName,
          evidenceCurrency,
          contractAligned: v.contractAligned,
          scanCoverage,
          disclosureHistory: 70,
          overallScore: Math.min(100, Math.max(0, overall)),
          breakdown: assurance.breakdown,
          expiredEvidence: expired,
          modelCount: v._count.provenanceRecords || 1,
          cosaiLayer: v.cosaiLayer
        };
      })
    );
    return { data: scores, meta: {} };
  }),

  getOverallSupplyChainRisk: protectedProcedure.query(async ({ ctx }) => {
    const vendors = await prisma.vendorAssurance.findMany({ where: { orgId: ctx.orgId } });
    if (vendors.length === 0) return { data: { overallScore: 100, rating: "LOW" }, meta: {} };
    let total = 0;
    for (const v of vendors) {
      const [assurance, expired] = await Promise.all([
        assessVendorPosture(prisma, ctx.orgId, v.id),
        checkEvidenceCurrency(prisma, ctx.orgId, v.id)
      ]);
      const evidenceCurrency = expired.length > 0 ? Math.max(0, 100 - expired.length * 20) : 100;
      const contractAlignment = v.contractAligned ? 100 : 0;
      const scanCoverage = 50;
      total += Math.min(100, Math.round(assurance.total * 30 + evidenceCurrency * 0.25 + contractAlignment * 0.2 + scanCoverage * 0.25));
    }
    const avg = total / vendors.length;
    const rating = avg >= 70 ? "LOW" : avg >= 40 ? "MEDIUM" : "HIGH";
    return { data: { overallScore: Math.round(avg), rating }, meta: {} };
  })
});
