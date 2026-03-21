/**
 * Vendor assurance – posture score, evidence currency, VRA integration.
 */
import type { PrismaClient } from "@prisma/client";
import { getQuestionsForVendorType } from "./vra-questions";

export type AssuranceScore = {
  total: number;
  breakdown: {
    soc2: number;
    iso27001: number;
    modelCards: number;
    slsa: number;
    vulnDisclosure: number;
    incidentSLA: number;
    vra: number;
  };
};

export type ExpiredEvidence = {
  type: string;
  message: string;
  expiredAt?: Date;
};

export type VraScoreResult = {
  score: number;
  applicableCount: number;
  answeredCount: number;
  completedCount: number;
};

const WEIGHTS = {
  soc2: 0.27,
  iso27001: 0.13,
  modelCards: 0.18,
  slsa: 0.13,
  vulnDisclosure: 0.09,
  incidentSLA: 0.09,
  vra: 0.11
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

function scoreVraAnswer(answer: string): number {
  switch (answer) {
    case "YES":
      return 1;
    case "PARTIAL":
      return 0.5;
    case "NO":
    case "NA":
    case "UNKNOWN":
    default:
      return 0;
  }
}

export async function computeVraScore(
  prisma: PrismaClient,
  orgId: string,
  vendorId: string,
  vendorType: string | null
): Promise<VraScoreResult> {
  const [vendor, responses] = await Promise.all([
    prisma.vendorAssurance.findFirst({ where: { id: vendorId, orgId } }),
    prisma.vendorVraResponse.findMany({
      where: { vendorId, orgId },
      select: { questionId: true, answer: true }
    })
  ]);
  if (!vendor) {
    return { score: 0, applicableCount: 0, answeredCount: 0, completedCount: 0 };
  }

  const questions = getQuestionsForVendorType(
    vendorType as import("@prisma/client").VendorType | null
  );
  const applicableCount = questions.length;
  if (applicableCount === 0) {
    return { score: 1, applicableCount: 0, answeredCount: 0, completedCount: 0 };
  }

  const responseMap = new Map(responses.map((r) => [r.questionId, r.answer]));
  let totalScore = 0;
  let completedCount = 0;

  for (const q of questions) {
    const answer = responseMap.get(q.id);
    if (answer !== undefined) {
      totalScore += scoreVraAnswer(answer);
      if (answer === "YES" || answer === "PARTIAL") completedCount++;
    }
  }

  const score = totalScore / applicableCount;
  return {
    score,
    applicableCount,
    answeredCount: responseMap.size,
    completedCount
  };
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
        incidentSLA: 0,
        vra: 0
      }
    };
  }

  const soc2Score = scoreSoc2(vendor.soc2Status, vendor.soc2ExpiresAt);
  const isoScore = scoreIso27001(vendor.iso27001Status);
  const modelScore = vendor.modelCardAvailable ? 1 : 0;
  const slsaScore = scoreSlsa(vendor.slsaLevel);
  const vulnScore = 0.5;
  const incidentScore = vendor.contractAligned ? 1 : 0.5;
  const vraResult = await computeVraScore(prisma, orgId, vendorId, vendor.vendorType);
  const vraScore = vraResult.applicableCount === 0 ? 1 : vraResult.score;

  const total =
    soc2Score * WEIGHTS.soc2 +
    isoScore * WEIGHTS.iso27001 +
    modelScore * WEIGHTS.modelCards +
    slsaScore * WEIGHTS.slsa +
    vulnScore * WEIGHTS.vulnDisclosure +
    incidentScore * WEIGHTS.incidentSLA +
    vraScore * WEIGHTS.vra;

  return {
    total: Math.round(total * 100) / 100,
    breakdown: {
      soc2: soc2Score * WEIGHTS.soc2,
      iso27001: isoScore * WEIGHTS.iso27001,
      modelCards: modelScore * WEIGHTS.modelCards,
      slsa: slsaScore * WEIGHTS.slsa,
      vulnDisclosure: vulnScore * WEIGHTS.vulnDisclosure,
      incidentSLA: incidentScore * WEIGHTS.incidentSLA,
      vra: vraScore * WEIGHTS.vra
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

export async function getVraStatus(
  prisma: PrismaClient,
  orgId: string,
  vendorId: string,
  vendorType: string | null
): Promise<"NOT_STARTED" | "IN_PROGRESS" | "COMPLETE"> {
  const result = await computeVraScore(
    prisma,
    orgId,
    vendorId,
    vendorType as import("@prisma/client").VendorType | null
  );
  if (result.applicableCount === 0) return "COMPLETE";
  if (result.answeredCount === 0) return "NOT_STARTED";
  if (result.answeredCount >= result.applicableCount) return "COMPLETE";
  return "IN_PROGRESS";
}
