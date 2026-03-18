/**
 * lib/dashboard/cached-queries.ts
 * Cached dashboard data fetchers — use Prisma + engines directly
 * so unstable_cache doesn't hit headers() or cookies()
 */
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { calculateKPI } from "@/lib/value/kpi-engine";
import * as engine from "@/lib/compliance/engine";

// ─── KPIs ─────────────────────────────────────────────────────────────────────

export function getCachedKPIs(orgId: string) {
  return unstable_cache(
    async () => {
      const context = { orgId, prisma };
      const [
        totalAssets,
        complianceScore,
        criticalRisks,
        euHighRisk,
        withoutAccountability,
        staleCards,
        failedScans,
        vendorsExpiring,
      ] = await Promise.all([
        calculateKPI("TOTAL_AI_ASSETS", context),
        calculateKPI("COMPLIANCE_SCORE", context),
        calculateKPI("CRITICAL_RISKS", context),
        calculateKPI("EU_HIGH_RISK_ASSETS", context),
        calculateKPI("ASSETS_WITHOUT_ACCOUNTABILITY", context),
        calculateKPI("STALE_CARDS", context),
        calculateKPI("FAILED_SCAN_POLICIES", context),
        calculateKPI("VENDORS_EXPIRING", context),
      ]);
      return {
        data: {
          totalAssets,
          complianceScore,
          criticalRisks,
          euHighRisk,
          withoutAccountability,
          staleCards,
          failedScans,
          vendorsExpiring,
        }
      };
    },
    [`dashboard-kpis-${orgId}`],
    { revalidate: 300, tags: [`org-${orgId}`, "kpis"] }
  )();
}

// ─── Layer posture ────────────────────────────────────────────────────────────

const COSAI_LAYERS = [
  "LAYER_1_BUSINESS",
  "LAYER_2_INFORMATION",
  "LAYER_3_APPLICATION",
  "LAYER_4_PLATFORM",
  "LAYER_5_SUPPLY_CHAIN",
] as const;

export function getCachedLayerPosture(orgId: string) {
  return unstable_cache(
    async () => {
      const assets = await prisma.aIAsset.findMany({
        where: { orgId, deletedAt: null },
        select: { id: true },
      });

      const layers = [];
      for (const layer of COSAI_LAYERS) {
        const assignments = await prisma.accountabilityAssignment.findMany({
          where: { asset: { orgId, deletedAt: null }, cosaiLayer: layer },
          take: 1,
          orderBy: { updatedAt: "desc" },
        });
        let complianceSum = 0;
        let count = 0;
        for (const a of assets) {
          const r = await engine.calculateComplianceScore(prisma, a.id);
          const layerData = r.byLayer[layer];
          if (layerData) { complianceSum += layerData.percentage; count++; }
        }
        const risks = await prisma.riskRegister.count({
          where: { orgId, deletedAt: null, cosaiLayer: layer },
        });
        layers.push({
          layer,
          compliancePct: count > 0 ? Math.round(complianceSum / count) : 0,
          riskCount: risks,
          accountableOwner: assignments[0]?.accountableParty ?? null,
          lastReviewed: assignments[0]?.updatedAt ?? null,
        });
      }
      return { data: layers, meta: {} };
    },
    [`dashboard-layer-posture-${orgId}`],
    { revalidate: 300, tags: [`org-${orgId}`, "layer-posture"] }
  )();
}

// ─── Compliance heatmap ───────────────────────────────────────────────────────

export function getCachedHeatmap(orgId: string) {
  return unstable_cache(
    async () => {
      const frameworks = await prisma.complianceFramework.findMany({
        where: { orgId, isActive: true },
        select: { id: true, code: true },
      });
      const assets = await prisma.aIAsset.findMany({
        where: { orgId, deletedAt: null },
        select: { id: true, assetType: true },
      });
      const rows: { framework: string; [assetType: string]: string | number }[] = [];
      for (const fw of frameworks) {
        const row: { framework: string; [assetType: string]: string | number } = { framework: fw.code };
        const byType: Record<string, number[]> = {};
        for (const a of assets) {
          const r = await engine.calculateComplianceScore(prisma, a.id, fw.id);
          if (!byType[a.assetType]) byType[a.assetType] = [];
          byType[a.assetType].push(r.percentage);
        }
        for (const [t, pcts] of Object.entries(byType)) {
          row[t] = pcts.length > 0 ? Math.round(pcts.reduce((s, p) => s + p, 0) / pcts.length) : 0;
        }
        rows.push(row);
      }
      return { data: rows, meta: {} };
    },
    [`dashboard-heatmap-${orgId}`],
    { revalidate: 300, tags: [`org-${orgId}`, "heatmap"] }
  )();
}

// ─── Risk matrix ──────────────────────────────────────────────────────────────

export function getCachedRiskMatrix(orgId: string) {
  return unstable_cache(
    async () => {
      const risks = await prisma.riskRegister.findMany({
        where: { orgId, deletedAt: null },
        select: { likelihood: true, impact: true, riskScore: true, id: true, title: true },
      });
      const matrix: Record<string, { count: number; risks: { id: string; title: string }[] }> = {};
      for (let l = 1; l <= 5; l++) {
        for (let i = 1; i <= 5; i++) {
          const key = `${l}-${i}`;
          const cell = risks.filter((r) => (r.likelihood ?? 0) === l && (r.impact ?? 0) === i);
          matrix[key] = { count: cell.length, risks: cell.map((r) => ({ id: r.id, title: r.title })) };
        }
      }
      return { data: matrix, meta: {} };
    },
    [`dashboard-risk-matrix-${orgId}`],
    { revalidate: 300, tags: [`org-${orgId}`, "risk-matrix"] }
  )();
}

// ─── Maturity score ───────────────────────────────────────────────────────────

export function getCachedMaturity(orgId: string) {
  return unstable_cache(
    async () => {
      const latest = await prisma.maturityAssessment.findFirst({
        where: { orgId },
        orderBy: { createdAt: "desc" },
        select: {
          maturityLevel: true,
          scores: true,
          createdAt: true,
        },
      });

      // Derive next steps from scores — mirrors tRPC router logic
      const scores = (latest?.scores ?? {}) as Record<string, number>;
      const LAYER_NAMES: Record<string, string> = {
        L1: "LAYER_1_BUSINESS", L2: "LAYER_2_INFORMATION",
        L3: "LAYER_3_APPLICATION", L4: "LAYER_4_PLATFORM", L5: "LAYER_5_SUPPLY_CHAIN",
      };
      const LAYER_ACTIONS: Record<string, string> = {
        L1: "Define AI governance policies and accountability owners",
        L2: "Classify data assets and implement privacy controls",
        L3: "Implement application-level guardrails and safety controls",
        L4: "Secure platform infrastructure and API gateways",
        L5: "Validate model supply chain and vendor evidence",
      };
      const nextSteps = Object.entries(scores)
        .filter(([key]) => key !== "overall")
        .sort(([, a], [, b]) => (a as number) - (b as number))
        .slice(0, 3)
        .map(([key, score]) => ({
          layer: LAYER_NAMES[key] ?? key,
          action: LAYER_ACTIONS[key] ?? `Improve ${key} maturity`,
          priority: (score as number) <= 2 ? "HIGH" : "MEDIUM",
        }));

      return {
        data: {
          maturityLevel: latest?.maturityLevel ?? 1,
          scores: latest?.scores ?? {},
          nextSteps,
          lastAssessedAt: latest?.createdAt ?? null,
        }
      };
    },
    [`dashboard-maturity-${orgId}`],
    { revalidate: 300, tags: [`org-${orgId}`, "maturity"] }
  )();
}

// ─── Sankey data ──────────────────────────────────────────────────────────────

export function getCachedSankey(orgId: string) {
  return unstable_cache(
    async () => {
      const [
        governancePolicyCount,
        lineageCount,
        masterDataCount,
        assetCount,
        assetsWithScans,
        l4VendorCount,
        l5VendorCount,
        risksByLayer,
      ] = await Promise.all([
        prisma.dataGovernancePolicy.count({ where: { orgId } }),
        prisma.dataLineageRecord.count({ where: { orgId, sourceEntityId: { not: null }, targetAssetId: { not: null } } }),
        prisma.masterDataEntity.count({ where: { orgId } }),
        prisma.aIAsset.count({ where: { orgId, deletedAt: null } }),
        prisma.scanRecord.groupBy({ by: ["assetId"], where: { orgId } }),
        prisma.vendorAssurance.count({ where: { orgId, OR: [{ vendorType: "INFRASTRUCTURE" }, { vendorType: "TOOLING" }, { cosaiLayer: "LAYER_4_PLATFORM" }] } }),
        prisma.vendorAssurance.count({ where: { orgId, OR: [{ vendorType: "MODEL_PROVIDER" }, { vendorType: "DATA_PROVIDER" }, { cosaiLayer: "LAYER_5_SUPPLY_CHAIN" }] } }),
        prisma.riskRegister.findMany({ where: { orgId, deletedAt: null, cosaiLayer: { not: null } }, select: { cosaiLayer: true } }),
      ]);

      const assetsWithPlatformDeps = assetsWithScans.length;
      const riskCountByLayer: Record<string, number> = {};
      for (const r of risksByLayer) {
        const layer = r.cosaiLayer!;
        riskCountByLayer[layer] = (riskCountByLayer[layer] ?? 0) + 1;
      }

      const LAYER_COLORS: Record<string, string> = {
        LAYER_1_BUSINESS: "#1D9E75", LAYER_2_INFORMATION: "#534AB7",
        LAYER_3_APPLICATION: "#D85A30", LAYER_4_PLATFORM: "#185FA5", LAYER_5_SUPPLY_CHAIN: "#5F5E5A",
      };
      const LAYER_LABELS: Record<string, string> = {
        LAYER_1_BUSINESS: "Business", LAYER_2_INFORMATION: "Information",
        LAYER_3_APPLICATION: "Application", LAYER_4_PLATFORM: "Platform", LAYER_5_SUPPLY_CHAIN: "Supply Chain",
      };
      const layerOrder = ["LAYER_1_BUSINESS","LAYER_2_INFORMATION","LAYER_3_APPLICATION","LAYER_4_PLATFORM","LAYER_5_SUPPLY_CHAIN"];
      const assetCounts = [
        Math.max(1, governancePolicyCount), Math.max(1, masterDataCount),
        Math.max(1, assetCount), Math.max(1, l4VendorCount), Math.max(1, l5VendorCount),
      ];

      const nodes = layerOrder.map((layer, i) => ({
        id: `L${i + 1}`, label: LAYER_LABELS[layer], assetCount: assetCounts[i],
        complianceScore: 75, riskCount: riskCountByLayer[layer] ?? 0, color: LAYER_COLORS[layer],
      }));
      const links = [
        { source: "L1", target: "L2", value: Math.max(5, governancePolicyCount) },
        { source: "L2", target: "L3", value: Math.max(5, lineageCount) },
        { source: "L3", target: "L4", value: Math.max(5, assetsWithPlatformDeps) },
        { source: "L4", target: "L5", value: Math.max(5, l5VendorCount) },
      ];

      return { data: { nodes, links }, meta: {} };
    },
    [`dashboard-sankey-${orgId}`],
    { revalidate: 300, tags: [`org-${orgId}`, "sankey"] }
  )();
}
