/**
 * Framework definitions – NIST_AI_RMF, EU_AI_ACT, COSAI_SRF, NIST_CSF.
 */
import path from "node:path";
import { readFileSync } from "node:fs";

import type { PrismaClient } from "@prisma/client";

//const DATA_DIR = path.join(__dirname, "data");
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, "data");

type ControlInput = {
  controlId: string;
  title: string;
  description?: string;
  category?: string;
  cosaiLayer?: string;
  personaAccountable?: string;
  operatingModelApplicability?: string[];
  verticalApplicability?: string[];
  implementationGuidance?: string;
  evidenceGuidance?: string;
  crossFrameworkIds?: string[];
  status: string;
};

type FrameworkData = {
  framework: { code: string; version: string; name: string; description?: string };
  controls: ControlInput[];
};

const FRAMEWORK_FILES: Record<string, string> = {
  NIST_AI_RMF: "nist-ai-rmf.json",
  EU_AI_ACT: "eu-ai-act.json",
  COSAI_SRF: "cosai-srf.json",
  NIST_CSF: "nist-csf.json"
};

function loadFrameworkData(code: string): FrameworkData {
  const file = FRAMEWORK_FILES[code];
  if (!file) throw new Error(`Unknown framework: ${code}`);
  const raw = readFileSync(path.join(DATA_DIR, file), "utf-8");
  return JSON.parse(raw) as FrameworkData;
}

function mapCosaiLayer(layer?: string): string | null {
  if (!layer) return null;
  const map: Record<string, string> = {
    LAYER_1_BUSINESS: "LAYER_1_BUSINESS",
    LAYER_2_INFORMATION: "LAYER_2_INFORMATION",
    LAYER_3_APPLICATION: "LAYER_3_APPLICATION",
    LAYER_4_PLATFORM: "LAYER_4_PLATFORM",
    LAYER_5_SUPPLY_CHAIN: "LAYER_5_SUPPLY_CHAIN"
  };
  return map[layer] ?? null;
}

export async function seedFrameworks(prisma: PrismaClient, orgId: string): Promise<void> {
  for (const code of Object.keys(FRAMEWORK_FILES)) {
    const data = loadFrameworkData(code);
    const { framework, controls } = data;

    const fw = await prisma.complianceFramework.upsert({
      where: {
        orgId_code: { orgId, code: code as "NIST_AI_RMF" | "EU_AI_ACT" | "COSAI_SRF" | "NIST_CSF" }
      },
      create: {
        orgId,
        code: framework.code as "NIST_AI_RMF" | "EU_AI_ACT" | "COSAI_SRF" | "NIST_CSF",
        version: framework.version,
        name: framework.name,
        description: framework.description ?? null,
        isActive: true
      },
      update: {
        version: framework.version,
        name: framework.name,
        description: framework.description ?? null
      }
    });

    for (const c of controls) {
      await prisma.control.upsert({
        where: {
          frameworkId_controlId: { frameworkId: fw.id, controlId: c.controlId }
        },
        create: {
          frameworkId: fw.id,
          controlId: c.controlId,
          title: c.title,
          description: c.description ?? null,
          category: c.category ?? null,
          cosaiLayer: mapCosaiLayer(c.cosaiLayer) as "LAYER_1_BUSINESS" | "LAYER_2_INFORMATION" | "LAYER_3_APPLICATION" | "LAYER_4_PLATFORM" | "LAYER_5_SUPPLY_CHAIN" | null,
          personaAccountable: c.personaAccountable ?? null,
          operatingModelApplicability: c.operatingModelApplicability ?? null,
          verticalApplicability: c.verticalApplicability ?? null,
          implementationGuidance: c.implementationGuidance ?? null,
          evidenceGuidance: c.evidenceGuidance ?? null,
          crossFrameworkIds: c.crossFrameworkIds ?? null
        },
        update: {
          title: c.title,
          description: c.description ?? null,
          category: c.category ?? null,
          cosaiLayer: mapCosaiLayer(c.cosaiLayer) as "LAYER_1_BUSINESS" | "LAYER_2_INFORMATION" | "LAYER_3_APPLICATION" | "LAYER_4_PLATFORM" | "LAYER_5_SUPPLY_CHAIN" | null,
          personaAccountable: c.personaAccountable ?? null,
          operatingModelApplicability: c.operatingModelApplicability ?? null,
          verticalApplicability: c.verticalApplicability ?? null,
          implementationGuidance: c.implementationGuidance ?? null,
          evidenceGuidance: c.evidenceGuidance ?? null,
          crossFrameworkIds: c.crossFrameworkIds ?? null
        }
      });
    }
  }
}
