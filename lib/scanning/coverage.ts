/**
 * Scan coverage – matrix, policy, compliance.
 */
import type { PrismaClient } from "@prisma/client";

export type CoverageRow = {
  assetId: string;
  assetName: string;
  scans: {
    scanType: string;
    lastDate: Date | null;
    pass: boolean | null;
    daysSince: number | null;
  }[];
};

export type CoverageMatrix = {
  assets: CoverageRow[];
  scanTypes: string[];
};

export type RequiredScan = {
  scanType: string;
  frequency: string;
  reason: string;
};

export type ComplianceResult = {
  compliant: boolean;
  required: RequiredScan[];
  passed: string[];
  missing: string[];
  overdue: string[];
  score: number;
};

const EU_HIGH_SCANS: RequiredScan[] = [
  { scanType: "MODEL_SCAN", frequency: "quarterly", reason: "EU HIGH" },
  { scanType: "DATASET_PII", frequency: "quarterly", reason: "EU HIGH" },
  { scanType: "RED_TEAM", frequency: "annual", reason: "EU HIGH" }
];

const ALL_SCANS: RequiredScan[] = [
  { scanType: "SBOM_DEPENDENCY", frequency: "quarterly", reason: "All assets" }
];

const QUARTERLY_DAYS = 92;
const ANNUAL_DAYS = 365;

export async function getScanCoverage(prisma: PrismaClient, orgId: string): Promise<CoverageMatrix> {
  const assets = await prisma.aIAsset.findMany({
    where: { orgId, deletedAt: null },
    select: { id: true, name: true }
  });

  const scanTypes: string[] = ["SBOM", "SBOM_DEPENDENCY", "VULN", "MODEL_SCAN", "DATASET_PII", "RED_TEAM"];
  const rows: CoverageRow[] = [];

  for (const asset of assets) {
    const records = await prisma.scanRecord.findMany({
      where: { assetId: asset.id, status: "COMPLETED" },
      orderBy: { completedAt: "desc" }
    });

    const byType = new Map<string, { lastDate: Date; pass: boolean }>();
    for (const r of records) {
      if (!byType.has(r.scanType)) {
        byType.set(r.scanType, {
          lastDate: r.completedAt ?? r.startedAt,
          pass: r.policyPassed ?? false
        });
      }
    }

    const scans = scanTypes.map((st) => {
      const rec = byType.get(st);
      if (!rec) {
        return { scanType: st, lastDate: null, pass: null, daysSince: null };
      }
      const days = Math.floor((Date.now() - rec.lastDate.getTime()) / 86400000);
      return {
        scanType: st,
        lastDate: rec.lastDate,
        pass: rec.pass,
        daysSince: days
      };
    });

    rows.push({ assetId: asset.id, assetName: asset.name, scans });
  }

  return { assets: rows, scanTypes };
}

export async function getScanPolicy(prisma: PrismaClient, assetId: string): Promise<RequiredScan[]> {
  const asset = await prisma.aIAsset.findFirst({
    where: { id: assetId },
    select: { euRiskLevel: true }
  });

  const required: RequiredScan[] = [...ALL_SCANS];
  if (asset?.euRiskLevel === "HIGH") {
    required.push(...EU_HIGH_SCANS);
  }
  return required;
}

export async function checkScanCompliance(prisma: PrismaClient, assetId: string): Promise<ComplianceResult> {
  const required = await getScanPolicy(prisma, assetId);
  const records = await prisma.scanRecord.findMany({
    where: { assetId, status: "COMPLETED" },
    orderBy: { completedAt: "desc" }
  });

  const byType = new Map<string, { completedAt: Date; pass: boolean }>();
  for (const r of records) {
    const dt = r.completedAt ?? r.startedAt;
    if (!byType.has(r.scanType) || (byType.get(r.scanType)?.completedAt.getTime() ?? 0) < dt.getTime()) {
      byType.set(r.scanType, { completedAt: dt, pass: r.policyPassed ?? false });
    }
  }

  const passed: string[] = [];
  const missing: string[] = [];
  const overdue: string[] = [];
  const now = Date.now();

  for (const req of required) {
    const rec = byType.get(req.scanType);
    const maxDays = req.frequency === "quarterly" ? QUARTERLY_DAYS : ANNUAL_DAYS;
    if (!rec) {
      missing.push(req.scanType);
    } else {
      const days = Math.floor((now - rec.completedAt.getTime()) / 86400000);
      if (rec.pass && days <= maxDays) {
        passed.push(req.scanType);
      } else if (days > maxDays) {
        overdue.push(req.scanType);
      } else {
        missing.push(req.scanType);
      }
    }
  }

  const score = required.length > 0 ? Math.round((passed.length / required.length) * 100) : 100;
  return {
    compliant: missing.length === 0 && overdue.length === 0,
    required,
    passed,
    missing,
    overdue,
    score
  };
}
