/**
 * Load compliance framework rows with code::text so PostgreSQL enum values always
 * deserialize even if the DB was migrated (new FrameworkCode values) before
 * `prisma generate` was run on a given machine (avoids "Value X not found in enum").
 */
import { Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";

export type FrameworkRow = {
  id: string;
  orgId: string;
  code: string;
  version: string;
  name: string;
  description: string | null;
  verticalApplicability: unknown;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type FrameworkRowWithCount = FrameworkRow & { controlCount: number };

/** Active frameworks for an org — code returned as plain string */
export async function loadActiveFrameworksForOrg(
  prisma: PrismaClient,
  orgId: string,
  opts?: { frameworkId?: string }
): Promise<{ id: string; code: string }[]> {
  if (opts?.frameworkId) {
    return prisma.$queryRaw<{ id: string; code: string }[]>`
      SELECT id, code::text AS code
      FROM "ComplianceFramework"
      WHERE "orgId" = ${orgId}
        AND "isActive" = true
        AND id = ${opts.frameworkId}
      LIMIT 1
    `;
  }
  return prisma.$queryRaw<{ id: string; code: string }[]>`
    SELECT id, code::text AS code
    FROM "ComplianceFramework"
    WHERE "orgId" = ${orgId}
      AND "isActive" = true
    LIMIT 100
  `;
}

/** Framework id → code (and name) for IN (...) lookups */
export async function loadFrameworkMetaByIds(
  prisma: PrismaClient,
  ids: string[]
): Promise<{ id: string; code: string; name: string }[]> {
  if (ids.length === 0) return [];
  return prisma.$queryRaw<{ id: string; code: string; name: string }[]>`
    SELECT id, code::text AS code, name
    FROM "ComplianceFramework"
    WHERE id IN (${Prisma.join(ids)})
  `;
}

/** Full active framework list with control counts (for compliance UI) */
export async function loadActiveFrameworksWithControlCount(
  prisma: PrismaClient,
  orgId: string
): Promise<FrameworkRowWithCount[]> {
  const rows = await prisma.$queryRaw<
    (FrameworkRow & { controlCount: bigint })[]
  >`
    SELECT
      f.id,
      f."orgId",
      f.code::text AS code,
      f.version,
      f.name,
      f.description,
      f."verticalApplicability",
      f."isActive",
      f."createdAt",
      f."updatedAt",
      (SELECT COUNT(*)::int FROM "Control" c WHERE c."frameworkId" = f.id) AS "controlCount"
    FROM "ComplianceFramework" f
    WHERE f."orgId" = ${orgId}
      AND f."isActive" = true
    ORDER BY f.name ASC
  `;
  return rows.map((r) => ({
    ...r,
    controlCount: Number(r.controlCount)
  }));
}
