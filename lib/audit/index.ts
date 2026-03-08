/**
 * Audit – central audit logging used by every mutation. Must be atomic with the originating transaction.
 *
 * Prisma: AuditLog model does not exist yet; it will be added in Prompt 02.
 * Import: `import type { Prisma } from "@prisma/client";`
 * TransactionClient is the callback parameter of prisma.$transaction(async (tx) => ...).
 */

/** All supported audit actions. Export as type for schema enum and routers. */
export const AUDIT_ACTIONS = [
  "CREATE",
  "UPDATE",
  "DELETE",
  "RESTORE",
  "ATTEST",
  "APPROVE",
  "REJECT",
  "LOGIN",
  "LOGOUT",
  "LOGIN_FAILED",
  "SET_FEATURE_FLAG",
  "EXPORT",
  "IMPORT"
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export type AuditContext = {
  orgId: string;
  userId: string;
  ipAddress?: string;
  userAgent?: string;
};

/**
 * Shape of a single audit log row once the AuditLog model exists (Prompt 02).
 */
export type AuditLogEntry = {
  id: string;
  orgId: string;
  userId: string;
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  prevState: Record<string, unknown> | null;
  nextState: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
};

/**
 * Transaction client shape for audit: must have auditLog.create / findMany / count.
 * Use the `tx` argument from prisma.$transaction(async (tx) => { ... }) or pass the root PrismaClient for reads.
 */
export type AuditTransactionClient = {
  auditLog: {
    create: (args: {
      data: {
        orgId: string;
        userId: string;
        action: string;
        resourceType: string;
        resourceId: string;
        prevState?: unknown;
        nextState?: unknown;
        ipAddress?: string | null;
        userAgent?: string | null;
      };
    }) => Promise<AuditLogEntry>;
    findMany: (args: {
      where: {
        orgId: string;
        resourceType?: string;
        resourceId?: string;
        userId?: string;
        action?: string;
        createdAt?: { gte?: Date; lte?: Date };
      };
      orderBy: { createdAt: "desc" };
      skip: number;
      take: number;
    }) => Promise<AuditLogEntry[]>;
    count: (args: {
      where: {
        orgId: string;
        resourceType?: string;
        resourceId?: string;
        userId?: string;
        action?: string;
        createdAt?: { gte?: Date; lte?: Date };
      };
    }) => Promise<number>;
  };
};

/**
 * Write one audit log record. Must run inside the same database transaction as the originating mutation
 * so that the log is committed or rolled back atomically with the business data.
 *
 * @param params - action, resourceType, resourceId, optional prev/next state, context, and transaction client
 * @param params.tx - Prisma transaction client from prisma.$transaction callback. NEVER pass the root PrismaClient for writes.
 *
 * @warning NEVER call this function outside a prisma.$transaction(...). Calling it with the root client
 * or without a transaction can leave audit logs committed while the related mutation rolls back, breaking audit integrity.
 */
export async function writeAuditLog(params: {
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  prevState?: Record<string, unknown>;
  nextState?: Record<string, unknown>;
  context: AuditContext;
  tx: AuditTransactionClient;
}): Promise<void> {
  const { action, resourceType, resourceId, prevState, nextState, context, tx } = params;
  await tx.auditLog.create({
    data: {
      orgId: context.orgId,
      userId: context.userId,
      action,
      resourceType,
      resourceId,
      prevState: prevState ?? undefined,
      nextState: nextState ?? undefined,
      ipAddress: context.ipAddress ?? null,
      userAgent: context.userAgent ?? null
    }
  });
}

export type QueryAuditLogParams = {
  orgId: string;
  resourceType?: string;
  resourceId?: string;
  userId?: string;
  action?: AuditAction;
  from?: Date;
  to?: Date;
  page?: number;
  pageSize?: number;
  /** When provided, runs inside this transaction; otherwise use for standalone read (pass root client). */
  tx?: AuditTransactionClient;
};

/**
 * Query audit log with filters and pagination.
 * Pass `tx` when inside a transaction, or pass the root PrismaClient as `tx` for a standalone read.
 */
export async function queryAuditLog(params: QueryAuditLogParams): Promise<{
  entries: AuditLogEntry[];
  total: number;
}> {
  const {
    orgId,
    resourceType,
    resourceId,
    userId,
    action,
    from,
    to,
    page = 1,
    pageSize = 20,
    tx
  } = params;

  if (!tx) {
    throw new Error("queryAuditLog requires tx (transaction client or root PrismaClient)");
  }

  const where = {
    orgId,
    ...(resourceType != null && { resourceType }),
    ...(resourceId != null && { resourceId }),
    ...(userId != null && { userId }),
    ...(action != null && { action }),
    ...((from != null || to != null) && {
      createdAt: {
        ...(from != null && { gte: from }),
        ...(to != null && { lte: to })
      }
    })
  };

  const skip = Math.max(0, (page - 1) * pageSize);
  const take = Math.max(1, Math.min(100, pageSize));

  const [entries, total] = await Promise.all([
    tx.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take
    }),
    tx.auditLog.count({ where })
  ]);

  return { entries, total };
}
