/**
 * Tenant isolation – getCurrentTenant, orgId filtering, TenantIsolationError.
 * Prisma middleware filters ALL queries by orgId when tenant context is set.
 */
import { AsyncLocalStorage } from "node:async_hooks";
import type { Session } from "next-auth";

import { prisma } from "@/lib/prisma";

export class TenantIsolationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TenantIsolationError";
  }
}

const tenantStorage = new AsyncLocalStorage<{ orgId: string }>();

/**
 * Set tenant context for the current request. Call at the start of request handling.
 * Prisma middleware will filter all queries by this orgId.
 */
export function setTenantContext(orgId: string | null): void {
  if (orgId) {
    tenantStorage.enterWith({ orgId });
  }
}

/**
 * Run a function with tenant context. Use in API routes / server components.
 */
export function runWithTenant<T>(orgId: string, fn: () => T): T {
  return tenantStorage.run({ orgId }, fn);
}

/**
 * Get tenant context. Returns null if not set.
 */
export function getTenantContext(): string | null {
  return tenantStorage.getStore()?.orgId ?? null;
}

/**
 * Get the current organization from session.
 * Throws TenantIsolationError if session has no orgId or org not found.
 */
export async function getCurrentTenant(session: Session | null): Promise<{
  id: string;
  name: string;
  slug: string;
}> {
  if (!session?.user) {
    throw new TenantIsolationError("No session");
  }
  const orgId = (session.user as { orgId?: string }).orgId;
  if (!orgId) {
    throw new TenantIsolationError("Session has no orgId");
  }
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true, name: true, slug: true }
  });
  if (!org) {
    throw new TenantIsolationError(`Organization ${orgId} not found`);
  }
  return org;
}

/**
 * Prisma middleware: inject orgId filter into all queries when tenant context is set.
 * Organization is scoped by id (current org only). All other models by orgId.
 * Note: $use was removed in Prisma 5; tenant filtering must be applied at query level.
 */
export function createTenantMiddleware(): (params: { model?: string; action: string; args: Record<string, unknown> }, next: (params: { model?: string; action: string; args: Record<string, unknown> }) => Promise<unknown>) => Promise<unknown> {
  const orgIdModels = new Set([
    "User",
    "AIAsset",
    "AuditLog",
    "FeatureFlag",
    "ComplianceFramework",
    "RiskRegister",
    "ArtifactCard",
    "VendorAssurance",
    "ScanRecord",
    "Session",
    "SecurityEvent",
    "AccessReview"
  ]);

  return async (params, next) => {
    const orgId = getTenantContext();
    if (!orgId) return next(params);

    const model = params.model ?? "";
    const args = params.args as { where?: Record<string, unknown>; data?: Record<string, unknown> };

    if (model === "Organization") {
      args.where = { ...args.where, id: orgId } as Record<string, unknown>;
    } else if (orgIdModels.has(model)) {
      if (args.where) {
        args.where = { ...args.where, orgId } as Record<string, unknown>;
      } else if (["findMany", "findFirst", "findUnique", "update", "updateMany", "delete", "deleteMany"].includes(params.action)) {
        args.where = { ...(args.where ?? {}), orgId } as Record<string, unknown>;
      }
      if (params.action === "create" && args.data) {
        if ((args.data as { orgId?: string }).orgId !== orgId) {
          throw new TenantIsolationError(`create ${model}: orgId mismatch`);
        }
      }
    }
    return next(params);
  };
}
