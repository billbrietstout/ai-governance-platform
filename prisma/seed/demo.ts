/**
 * Demo seed – Acme Corp, 5 users (one per role), 4 sample AIAssets.
 */
import type { PrismaClient } from "@prisma/client";

const DEMO_ORG = {
  name: "Acme Corp",
  slug: "acme-corp",
  verticalMarket: "GENERAL" as const
};

const DEMO_USERS = [
  { email: "admin@acme.example.com", role: "ADMIN" as const },
  { email: "caio@acme.example.com", role: "CAIO" as const },
  { email: "analyst@acme.example.com", role: "ANALYST" as const },
  { email: "viewer@acme.example.com", role: "VIEWER" as const },
  { email: "auditor@acme.example.com", role: "AUDITOR" as const }
];

const DEMO_ASSETS = [
  {
    name: "Customer Support Chatbot",
    description: "NLU-based chatbot for tier-1 support",
    assetType: "AGENT" as const,
    euRiskLevel: "MINIMAL" as const,
    cosaiLayer: "LAYER_3_APPLICATION" as const,
    verticalMarket: "GENERAL" as const
  },
  {
    name: "Fraud Detection Model",
    description: "ML model for transaction fraud detection",
    assetType: "MODEL" as const,
    euRiskLevel: "LIMITED" as const,
    cosaiLayer: "LAYER_2_INFORMATION" as const,
    verticalMarket: "GENERAL" as const
  },
  {
    name: "Document Summarization Pipeline",
    description: "LLM-based document summarization",
    assetType: "PIPELINE" as const,
    euRiskLevel: "HIGH" as const,
    cosaiLayer: "LAYER_4_PLATFORM" as const,
    verticalMarket: "GENERAL" as const
  },
  {
    name: "HR Screening Assistant",
    description: "AI-assisted resume screening",
    assetType: "APPLICATION" as const,
    euRiskLevel: "LIMITED" as const,
    cosaiLayer: "LAYER_1_BUSINESS" as const,
    verticalMarket: "GENERAL" as const
  }
];

export async function seedDemo(prisma: PrismaClient): Promise<string> {
  const org = await prisma.organization.upsert({
    where: { slug: DEMO_ORG.slug },
    create: {
      name: DEMO_ORG.name,
      slug: DEMO_ORG.slug,
      verticalMarket: DEMO_ORG.verticalMarket
    },
    update: { name: DEMO_ORG.name, verticalMarket: DEMO_ORG.verticalMarket }
  });

  for (const u of DEMO_USERS) {
    await prisma.user.upsert({
      where: { orgId_email: { orgId: org.id, email: u.email } },
      create: {
        orgId: org.id,
        email: u.email,
        role: u.role,
        mfaEnabled: u.role === "ADMIN" || u.role === "CAIO"
      },
      update: { role: u.role }
    });
  }

  const adminUser = await prisma.user.findFirst({
    where: { orgId: org.id, role: "ADMIN" },
    select: { id: true }
  });
  const ownerId = adminUser?.id ?? null;

  for (const a of DEMO_ASSETS) {
    const existing = await prisma.aIAsset.findFirst({
      where: { orgId: org.id, name: a.name }
    });
    if (existing) {
      await prisma.aIAsset.update({
        where: { id: existing.id },
        data: {
          description: a.description,
          euRiskLevel: a.euRiskLevel,
          cosaiLayer: a.cosaiLayer
        }
      });
    } else {
      await prisma.aIAsset.create({
        data: {
          orgId: org.id,
          name: a.name,
          description: a.description,
          assetType: a.assetType,
          euRiskLevel: a.euRiskLevel,
          cosaiLayer: a.cosaiLayer,
          verticalMarket: a.verticalMarket,
          ownerId,
          status: "ACTIVE"
        }
      });
    }
  }

  return org.id;
}
