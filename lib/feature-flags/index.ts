/**
 * Feature flags – DB-backed feature flags per organization.
 *
 * Prisma: FeatureFlag and AuditLog models do not exist yet; they will be added in Prompt 02.
 * The client type below describes the shape once the schema exists.
 * Import: `import type { PrismaClient } from "@prisma/client";`
 */

/** All module and vertical gate names. Export as type for schema enum definition. */
export const FEATURE_FLAG_NAMES = [
  "MODULE_SHADOW_AI",
  "MODULE_OPS_INTEL",
  "MODULE_AGENTIC",
  "MODULE_THREAT_IR",
  "MODULE_ROI",
  "VERTICAL_HEALTHCARE",
  "VERTICAL_FINANCIAL",
  "VERTICAL_AUTOMOTIVE"
] as const;

export type FeatureFlagName = (typeof FEATURE_FLAG_NAMES)[number];

/** Default map: every flag false. */
const DEFAULT_FLAGS: Record<FeatureFlagName, boolean> = FEATURE_FLAG_NAMES.reduce(
  (acc, name) => {
    acc[name] = false;
    return acc;
  },
  {} as Record<FeatureFlagName, boolean>
);

/**
 * Shape of Prisma client once FeatureFlag and AuditLog models exist (Prompt 02).
 * Use this type for the prisma parameter until schema is generated.
 */
export type FeatureFlagPrismaClient = {
  featureFlag: {
    findFirst: (args: {
      where: { orgId: string; name: string };
      select?: { enabled: boolean };
    }) => Promise<{ enabled: boolean } | null>;
    upsert: (args: {
      where: { orgId_name: { orgId: string; name: string } };
      create: { orgId: string; name: string; enabled: boolean; setBy: string };
      update: { enabled: boolean; setBy: string };
    }) => Promise<unknown>;
    findMany: (args: {
      where: { orgId: string };
      select: { name: true; enabled: true };
    }) => Promise<{ name: FeatureFlagName; enabled: boolean }[]>;
  };
  auditLog: {
    create: (args: {
      data: {
        orgId: string;
        action: string;
        setBy: string;
        details?: unknown;
      };
    }) => Promise<unknown>;
  };
};

/**
 * Use FeatureFlagPrismaClient as the prisma parameter type.
 * Once schema exists (Prompt 02), pass the real PrismaClient from "@prisma/client";
 * it will satisfy this interface.
 */
function getClient(prisma: FeatureFlagPrismaClient): FeatureFlagPrismaClient {
  return prisma;
}

/**
 * Get a single feature flag for an organization.
 * Returns false if the flag is not found (safe default).
 */
export async function getFlag(
  orgId: string,
  flag: FeatureFlagName,
  prisma: FeatureFlagPrismaClient
): Promise<boolean> {
  const db = getClient(prisma);
  const row = await db.featureFlag.findFirst({
    where: { orgId, name: flag },
    select: { enabled: true }
  });
  return row?.enabled ?? false;
}

/**
 * Set a feature flag for an organization (upsert) and record the change in AuditLog.
 */
export async function setFlag(
  orgId: string,
  flag: FeatureFlagName,
  enabled: boolean,
  setBy: string,
  prisma: FeatureFlagPrismaClient
): Promise<void> {
  const db = getClient(prisma);
  await db.featureFlag.upsert({
    where: { orgId_name: { orgId, name: flag } },
    create: { orgId, name: flag, enabled, setBy },
    update: { enabled, setBy }
  });
  await db.auditLog.create({
    data: {
      orgId,
      action: "SET_FEATURE_FLAG",
      setBy,
      details: { flag, enabled }
    }
  });
}

/**
 * Get all feature flags for an organization.
 * Any flag not present in the DB is returned as false.
 */
export async function getAllFlags(
  orgId: string,
  prisma: FeatureFlagPrismaClient
): Promise<Record<FeatureFlagName, boolean>> {
  const db = getClient(prisma);
  const rows = await db.featureFlag.findMany({
    where: { orgId },
    select: { name: true, enabled: true }
  });
  const result: Record<FeatureFlagName, boolean> = { ...DEFAULT_FLAGS };
  for (const row of rows) {
    if (FEATURE_FLAG_NAMES.includes(row.name)) {
      result[row.name] = row.enabled;
    }
  }
  return result;
}
