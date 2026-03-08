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
  })
});
