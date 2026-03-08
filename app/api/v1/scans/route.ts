/**
 * Scan webhook – receive scan results from external scanners.
 * POST /api/v1/scans – API key auth, write to ScanRecord.
 */
import type { ScanType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/env";
import { prisma } from "@/lib/prisma";
import { sanitizeObject, withCors } from "@/lib/security";

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
    const res = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return withCors(res, req.headers.get("origin"));
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    const res = NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    return withCors(res, req.headers.get("origin"));
  }

  const parsed = ScanPayload.safeParse(body);
  if (!parsed.success) {
    const res = NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
    return withCors(res, req.headers.get("origin"));
  }

  const raw = parsed.data;
  const sanitized = sanitizeObject({
    orgId: raw.orgId,
    assetId: raw.assetId,
    scannerName: raw.scannerName,
    scannerVersion: raw.scannerVersion ?? "",
    triggeredBy: raw.triggeredBy ?? ""
  });
  if (sanitized.threats.length > 0) {
    const res = NextResponse.json(
      { error: "Input rejected", threats: sanitized.threats },
      { status: 400 }
    );
    return withCors(res, req.headers.get("origin"));
  }

  const data = { ...raw };

  const org = await prisma.organization.findFirst({
    where: { id: data.orgId }
  });
  if (!org) {
    const res = NextResponse.json({ error: "Organization not found" }, { status: 404 });
    return withCors(res, req.headers.get("origin"));
  }

  const asset = await prisma.aIAsset.findFirst({
    where: { id: data.assetId, orgId: data.orgId, deletedAt: null }
  });
  if (!asset) {
    const res = NextResponse.json({ error: "Asset not found" }, { status: 404 });
    return withCors(res, req.headers.get("origin"));
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

  const res = NextResponse.json({ id: record.id, status: "created" }, { status: 201 });
  return withCors(res, req.headers.get("origin"));
}
