/**
 * Layer 4 – Platform – Telemetry, Drift Detection, Alert Engine.
 */
import { prisma } from "@/lib/prisma";
import { createTRPCRouter, protectedProcedure } from "../trpc";

const THIRTY_DAYS_AGO = (() => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d;
})();
const NINETY_DAYS_AGO = (() => {
  const d = new Date();
  d.setDate(d.getDate() - 90);
  return d;
})();

export const layer4Router = createTRPCRouter({
  getTelemetry: protectedProcedure.query(async ({ ctx }) => {
    const [allScans, recentScans, assets] = await Promise.all([
      prisma.scanRecord.findMany({
        where: { orgId: ctx.orgId },
        orderBy: { startedAt: "desc" },
        take: 100,
        include: { asset: { select: { id: true, name: true, assetType: true } } }
      }),
      prisma.scanRecord.findMany({
        where: { orgId: ctx.orgId, startedAt: { gte: THIRTY_DAYS_AGO } },
        orderBy: { startedAt: "desc" }
      }),
      prisma.aIAsset.findMany({
        where: { orgId: ctx.orgId, deletedAt: null },
        select: { id: true, name: true, assetType: true }
      })
    ]);

    const byType = allScans.reduce(
      (acc, s) => {
        acc[s.scanType] = (acc[s.scanType] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const byStatus = allScans.reduce(
      (acc, s) => {
        acc[s.status] = (acc[s.status] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const totalFindings = allScans.reduce((sum, s) => sum + (s.findingsCount ?? 0), 0);
    const criticalFindings = allScans.reduce((sum, s) => sum + (s.criticalFindings ?? 0), 0);
    const failedPolicies = allScans.filter((s) => s.policyPassed === false).length;
    const scannedAssetIds = new Set(allScans.map((s) => s.assetId));
    const unscannedAssets = assets.filter((a) => !scannedAssetIds.has(a.id));

    const recentActivity = allScans.slice(0, 20).map((s) => ({
      id: s.id,
      assetId: s.assetId,
      assetName: s.asset?.name ?? "Unknown",
      assetType: s.asset?.assetType ?? "Unknown",
      scanType: s.scanType,
      status: s.status,
      findingsCount: s.findingsCount,
      criticalFindings: s.criticalFindings,
      policyPassed: s.policyPassed,
      startedAt: s.startedAt,
      completedAt: s.completedAt
    }));

    return {
      data: {
        summary: {
          totalScans: allScans.length,
          scansLast30d: recentScans.length,
          totalFindings,
          criticalFindings,
          failedPolicies,
          coveragePercent:
            assets.length > 0 ? Math.round((scannedAssetIds.size / assets.length) * 100) : 0,
          unscannedCount: unscannedAssets.length
        },
        byType,
        byStatus,
        recentActivity,
        unscannedAssets: unscannedAssets.slice(0, 10)
      },
      meta: {}
    };
  }),

  getDrift: protectedProcedure.query(async ({ ctx }) => {
    const assets = await prisma.aIAsset.findMany({
      where: { orgId: ctx.orgId, deletedAt: null },
      select: {
        id: true,
        name: true,
        assetType: true,
        status: true,
        euRiskLevel: true,
        updatedAt: true,
        createdAt: true,
        scanRecords: {
          orderBy: { startedAt: "desc" },
          take: 2,
          select: {
            id: true,
            scanType: true,
            status: true,
            findingsCount: true,
            criticalFindings: true,
            policyPassed: true,
            startedAt: true
          }
        }
      }
    });

    const driftSignals = assets.map((asset) => {
      const scans = asset.scanRecords;
      const lastScan = scans[0] ?? null;
      const prevScan = scans[1] ?? null;

      const daysSinceUpdate = Math.floor(
        (Date.now() - new Date(asset.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      const daysSinceScan = lastScan
        ? Math.floor((Date.now() - new Date(lastScan.startedAt).getTime()) / (1000 * 60 * 60 * 24))
        : null;

      const findingsDelta =
        lastScan && prevScan ? (lastScan.findingsCount ?? 0) - (prevScan.findingsCount ?? 0) : null;

      const signals: string[] = [];
      if (!lastScan) signals.push("NEVER_SCANNED");
      else if (daysSinceScan !== null && daysSinceScan > 90) signals.push("SCAN_OVERDUE");
      if (lastScan?.policyPassed === false) signals.push("POLICY_FAILED");
      if (findingsDelta !== null && findingsDelta > 0) signals.push("FINDINGS_INCREASED");
      if (asset.euRiskLevel === "HIGH" && (!lastScan || (daysSinceScan ?? 999) > 30))
        signals.push("HIGH_RISK_STALE");

      const severity =
        signals.includes("POLICY_FAILED") || signals.includes("HIGH_RISK_STALE")
          ? "HIGH"
          : signals.includes("FINDINGS_INCREASED") || signals.includes("SCAN_OVERDUE")
            ? "MEDIUM"
            : signals.includes("NEVER_SCANNED")
              ? "MEDIUM"
              : "LOW";

      return {
        assetId: asset.id,
        assetName: asset.name,
        assetType: asset.assetType,
        euRiskLevel: asset.euRiskLevel,
        status: asset.status,
        daysSinceUpdate,
        daysSinceScan,
        lastScanStatus: lastScan?.status ?? null,
        lastPolicyPassed: lastScan?.policyPassed ?? null,
        findingsDelta,
        signals,
        severity
      };
    });

    const flagged = driftSignals.filter((d) => d.signals.length > 0);
    const bySeverity = {
      HIGH: flagged.filter((d) => d.severity === "HIGH").length,
      MEDIUM: flagged.filter((d) => d.severity === "MEDIUM").length,
      LOW: flagged.filter((d) => d.severity === "LOW").length
    };

    return {
      data: {
        summary: {
          totalAssets: assets.length,
          flaggedAssets: flagged.length,
          cleanAssets: assets.length - flagged.length,
          bySeverity
        },
        driftSignals: driftSignals.sort(
          (a, b) =>
            (b.severity === "HIGH" ? 2 : b.severity === "MEDIUM" ? 1 : 0) -
            (a.severity === "HIGH" ? 2 : a.severity === "MEDIUM" ? 1 : 0)
        )
      },
      meta: {}
    };
  }),

  getAlerts: protectedProcedure.query(async ({ ctx }) => {
    const [scans, assets, securityEvents] = await Promise.all([
      prisma.scanRecord.findMany({
        where: { orgId: ctx.orgId },
        orderBy: { startedAt: "desc" },
        take: 200,
        include: { asset: { select: { id: true, name: true, euRiskLevel: true } } }
      }),
      prisma.aIAsset.findMany({
        where: { orgId: ctx.orgId, deletedAt: null },
        select: {
          id: true,
          name: true,
          euRiskLevel: true,
          status: true,
          updatedAt: true,
          accountabilityAssignments: { select: { id: true } }
        }
      }),
      prisma.securityEvent.findMany({
        where: { orgId: ctx.orgId },
        orderBy: { createdAt: "desc" },
        take: 50
      })
    ]);

    const alerts: {
      id: string;
      severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
      category: string;
      title: string;
      detail: string;
      assetId?: string;
      assetName?: string;
      createdAt: Date;
    }[] = [];

    for (const scan of scans.filter((s) => s.policyPassed === false)) {
      alerts.push({
        id: `policy-${scan.id}`,
        severity: scan.asset?.euRiskLevel === "HIGH" ? "CRITICAL" : "HIGH",
        category: "SCAN_POLICY",
        title: "Scan Policy Failed",
        detail: `${scan.scanType} scan failed policy check`,
        assetId: scan.assetId,
        assetName: scan.asset?.name ?? "Unknown",
        createdAt: scan.startedAt
      });
    }

    for (const scan of scans.filter((s) => (s.criticalFindings ?? 0) > 0)) {
      alerts.push({
        id: `critical-${scan.id}`,
        severity: "HIGH",
        category: "CRITICAL_FINDINGS",
        title: `${scan.criticalFindings} Critical Finding${(scan.criticalFindings ?? 0) > 1 ? "s" : ""}`,
        detail: `${scan.scanType} scan found critical issues`,
        assetId: scan.assetId,
        assetName: scan.asset?.name ?? "Unknown",
        createdAt: scan.startedAt
      });
    }

    for (const asset of assets.filter(
      (a) => a.euRiskLevel === "HIGH" && a.accountabilityAssignments.length === 0
    )) {
      alerts.push({
        id: `accountability-${asset.id}`,
        severity: "HIGH",
        category: "GOVERNANCE",
        title: "High-Risk Asset Unaccountable",
        detail: "No accountability assignment for HIGH risk asset",
        assetId: asset.id,
        assetName: asset.name,
        createdAt: asset.updatedAt
      });
    }

    for (const event of securityEvents) {
      alerts.push({
        id: `security-${event.id}`,
        severity: event.eventType.includes("BRUTE") ? "CRITICAL" : "MEDIUM",
        category: "SECURITY",
        title: event.eventType.replace(/_/g, " "),
        detail: event.email ? `User: ${event.email}` : "System event",
        createdAt: event.createdAt
      });
    }

    alerts.sort((a, b) => {
      const sev = { CRITICAL: 3, HIGH: 2, MEDIUM: 1, LOW: 0 };
      return (
        sev[b.severity] - sev[a.severity] ||
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });

    const bySeverity = {
      CRITICAL: alerts.filter((a) => a.severity === "CRITICAL").length,
      HIGH: alerts.filter((a) => a.severity === "HIGH").length,
      MEDIUM: alerts.filter((a) => a.severity === "MEDIUM").length,
      LOW: alerts.filter((a) => a.severity === "LOW").length
    };

    return {
      data: { alerts: alerts.slice(0, 50), bySeverity, total: alerts.length },
      meta: {}
    };
  })
});
