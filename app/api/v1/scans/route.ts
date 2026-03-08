/**
 * Scan webhook – receive scan results from external scanners.
 * POST /api/v1/scans – API key auth, write to ScanRecord.
 */
import type { ScanType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/env";
import { prisma } from "@/lib/prisma";

const ScanPayload = z.object({
  orgId: z.string().min(1),
  assetId: z.string().min(1),
  scannerName: z.string().min(1),
  scannerVersion: z.string().optional(),
  scanType: z.enum([
    "SBOM",
    "SBOM_DEPENDENCY",
    "VULN",
    "SECRETS",
    "POLICY",
    "LICENSE",
    "MODEL_SCAN",
    "DATASET_PII",
    "RED_TEAM"
  ]),
  status: z.enum(["RUNNING", "COMPLETED", "FAILED"]),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  findingsCount: z.number().int().min(0).optional(),
  criticalFindings: z.number().int().min(0).optional(),
  findings: z.unknown().optional(),
  policyPassed: z.boolean().optional(),
  triggeredBy: z.string().optional()
});

function authApiKey(req: NextRequest): boolean {
  const key = env.SCAN_WEBHOOK_API_KEY;
  if (!key) return false;
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return false;
  return auth.slice(7) === key;
}

export async function POST(req: NextRequest) {
  if (!authApiKey(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = ScanPayload.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const org = await prisma.organization.findFirst({
    where: { id: data.orgId }
  });
  if (!org) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  const asset = await prisma.aIAsset.findFirst({
    where: { id: data.assetId, orgId: data.orgId, deletedAt: null }
  });
  if (!asset) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  const record = await prisma.scanRecord.create({
    data: {
      orgId: data.orgId,
      assetId: data.assetId,
      scannerName: data.scannerName,
      scannerVersion: data.scannerVersion ?? null,
      scanType: data.scanType as ScanType,
      status: data.status,
      startedAt: data.startedAt ? new Date(data.startedAt) : undefined,
      completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
      findingsCount: data.findingsCount ?? 0,
      criticalFindings: data.criticalFindings ?? 0,
      findings: data.findings != null ? (data.findings as object) : undefined,
      policyPassed: data.policyPassed ?? null,
      triggeredBy: data.triggeredBy ?? null
    }
  });

  return NextResponse.json({ id: record.id, status: "created" }, { status: 201 });
}
