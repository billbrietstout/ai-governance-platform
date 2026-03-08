/**
 * Vendor assurance – posture score, evidence currency.
 */
import type { PrismaClient } from "@prisma/client";

export type AssuranceScore = {
  total: number;
  breakdown: {
    soc2: number;
    iso27001: number;
    modelCards: number;
    slsa: number;
    vulnDisclosure: number;
    incidentSLA: number;
  };
};

export type ExpiredEvidence = {
  type: string;
  message: string;
  expiredAt?: Date;
};

const WEIGHTS = {
  soc2: 0.3,
  iso27001: 0.15,
  modelCards: 0.2,
  slsa: 0.15,
  vulnDisclosure: 0.1,
  incidentSLA: 0.1
};

function scoreSoc2(status: string | null, expiresAt: Date | null): number {
  if (!status || status === "NOT_APPLICABLE") return 0;
  if (status === "CERTIFIED") {
    if (expiresAt && expiresAt < new Date()) return 0.3;
    return 1;
  }
  if (status === "IN_PROGRESS") return 0.5;
  return 0;
}

function scoreIso27001(status: string | null): number {
  if (!status || status === "NOT_APPLICABLE") return 0;
  if (status === "CERTIFIED") return 1;
  if (status === "IN_PROGRESS") return 0.5;
  return 0;
}

function scoreSlsa(level: string | null): number {
  if (!level) return 0;
  const l = parseInt(String(level).replace("L", ""), 10);
  return Math.min(1, l / 4);
}

export async function assessVendorPosture(
  prisma: PrismaClient,
  orgId: string,
  vendorId: string
): Promise<AssuranceScore> {
  const vendor = await prisma.vendorAssurance.findFirst({
    where: { id: vendorId, orgId }
  });
  if (!vendor) {
    return {
      total: 0,
      breakdown: {
        soc2: 0,
        iso27001: 0,
        modelCards: 0,
        slsa: 0,
        vulnDisclosure: 0,
        incidentSLA: 0
      }
    };
  }

  const soc2Score = scoreSoc2(vendor.soc2Status, vendor.soc2ExpiresAt);
  const isoScore = scoreIso27001(vendor.iso27001Status);
  const modelScore = vendor.modelCardAvailable ? 1 : 0;
  const slsaScore = scoreSlsa(vendor.slsaLevel);
  const vulnScore = 0.5;
  const incidentScore = vendor.contractAligned ? 1 : 0.5;

  const total =
    soc2Score * WEIGHTS.soc2 +
    isoScore * WEIGHTS.iso27001 +
    modelScore * WEIGHTS.modelCards +
    slsaScore * WEIGHTS.slsa +
    vulnScore * WEIGHTS.vulnDisclosure +
    incidentScore * WEIGHTS.incidentSLA;

  return {
    total: Math.round(total * 100) / 100,
    breakdown: {
      soc2: soc2Score * WEIGHTS.soc2,
      iso27001: isoScore * WEIGHTS.iso27001,
      modelCards: modelScore * WEIGHTS.modelCards,
      slsa: slsaScore * WEIGHTS.slsa,
      vulnDisclosure: vulnScore * WEIGHTS.vulnDisclosure,
      incidentSLA: incidentScore * WEIGHTS.incidentSLA
    }
  };
}

export async function checkEvidenceCurrency(
  prisma: PrismaClient,
  orgId: string,
  vendorId: string
): Promise<ExpiredEvidence[]> {
  const vendor = await prisma.vendorAssurance.findFirst({
    where: { id: vendorId, orgId }
  });
  if (!vendor) return [];

  const expired: ExpiredEvidence[] = [];
  const now = new Date();

  if (vendor.soc2Status === "CERTIFIED" && vendor.soc2ExpiresAt && vendor.soc2ExpiresAt < now) {
    expired.push({
      type: "SOC2",
      message: "SOC2 certification expired (>12mo)",
      expiredAt: vendor.soc2ExpiresAt
    });
  }

  if (vendor.lastReviewedAt) {
    const ninetyDays = new Date(now);
    ninetyDays.setDate(ninetyDays.getDate() - 90);
    if (vendor.lastReviewedAt < ninetyDays) {
      expired.push({
        type: "MODEL_CARDS",
        message: "Model cards not reviewed in 90+ days",
        expiredAt: vendor.lastReviewedAt
      });
    }
  }

  if (vendor.nextReviewAt && vendor.nextReviewAt < now) {
    expired.push({
      type: "CERT_REVIEW",
      message: "Certification review overdue (24mo)",
      expiredAt: vendor.nextReviewAt
    });
  }

  return expired;
}
