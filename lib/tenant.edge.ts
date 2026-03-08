/**
 * Tenant – Edge-safe helpers for orgId/userId/role extraction from session/JWT.
 * No Prisma, no Node.js modules. Use in middleware.
 */

type SessionLike = { user?: { orgId?: string; id?: string; role?: string } } | null;

export function getOrgIdFromSession(session: SessionLike): string | null {
  return session?.user?.orgId ?? null;
}

export function getUserIdFromSession(session: SessionLike): string | null {
  return session?.user?.id ?? null;
}

export function getRoleFromSession(session: SessionLike): string | null {
  return session?.user?.role ?? null;
}
