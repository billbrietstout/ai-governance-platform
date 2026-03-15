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
    const [org, masterData, assets, lineage, vendors] = await Promise.all([
      prisma.organization.findUnique({
        where: { id: orgId },
        select: { id: true, name: true }
      }),
      prisma.masterDataEntity.findMany({
        where: { orgId },
        select: { id: true, name: true, entityType: true }
      }),
      prisma.aIAsset.findMany({
        where: { orgId, deletedAt: null },
        select: { id: true, name: true, assetType: true }
      }),
      prisma.dataLineageRecord.findMany({
        where: { orgId },
        select: { sourceEntityId: true, targetAssetId: true }
      }),
      prisma.vendorAssurance.findMany({
        where: { orgId },
        select: { id: true, vendorName: true, vendorType: true, cosaiLayer: true }
      })
    ]);

    const nodes: { id: string; label: string; layer: string; role: string; link?: string }[] = [];
    const edges: { from: string; to: string }[] = [];

    if (org) {
      nodes.push({
        id: `org-${org.id}`,
        label: org.name,
        layer: "L1",
        role: "Organization",
        link: "/settings"
      });
    }

    for (const m of masterData) {
      nodes.push({
        id: `mde-${m.id}`,
        label: m.name,
        layer: "L2",
        role: m.entityType,
        link: `/layer2-information/master-data`
      });
    }

    for (const a of assets) {
      nodes.push({
        id: `asset-${a.id}`,
        label: a.name,
        layer: "L3",
        role: a.assetType,
        link: `/layer3-application/assets/${a.id}`
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
        v.cosaiLayer === "LAYER_5_SUPPLY_CHAIN" ||
        v.vendorType === "OTHER" ||
        (!v.vendorType && !v.cosaiLayer)
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
    for (const v of vendors) {
      if (assigned.has(v.id)) continue;
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
          edges.push({ from: `mde-${l.sourceEntityId}`, to: `asset-${l.targetAssetId}` });
        }
      }
    }

    if (org) {
      for (const a of assets.slice(0, 3)) {
        edges.push({ from: `org-${org.id}`, to: `asset-${a.id}` });
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
    const vendors = await prisma.vendorAssurance.findMany({
      where: { orgId: ctx.orgId }
    });
    const scores = await Promise.all(
      vendors.map(async (v) => {
        const [assurance, expired, scanCoverage] = await Promise.all([
          assessVendorPosture(prisma, ctx.orgId, v.id),
          checkEvidenceCurrency(prisma, ctx.orgId, v.id),
          (async () => {
            const cards = await prisma.artifactCard.count({
              where: { orgId: ctx.orgId }
            });
            const scans = await prisma.scanRecord.count({
              where: { orgId: ctx.orgId }
            });
            return cards > 0 ? Math.min(100, Math.round((scans / Math.max(1, cards)) * 100)) : 0;
          })()
        ]);
        const evidenceCurrency = expired.length > 0 ? Math.max(0, 100 - expired.length * 20) : 100;
        const contractAlignment = v.contractAligned ? 100 : 0;
        const overall =
          Math.round(
            (assurance.total * 30 + evidenceCurrency * 0.25 + contractAlignment * 0.2 + scanCoverage * 0.25) / 1
          ) || 0;
        return {
          vendorId: v.id,
          vendorName: v.vendorName,
          evidenceCurrency,
          contractAligned: v.contractAligned,
          scanCoverage,
          disclosureHistory: 70,
          overallScore: Math.min(100, overall),
          breakdown: assurance.breakdown,
          expiredEvidence: expired
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
