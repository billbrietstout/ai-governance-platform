import { auth } from "@/auth";
import { redirect } from "next/navigation";

type Session = { user?: { id?: string; orgId?: string; isSuperAdmin?: boolean } } | null;

/**
 * Guard for API routes / Server Actions.
 * Returns typed success or error result.
 */
export function requireSuperAdmin(
  session: Session
):
  | { ok: false; status: 401 | 403; body: { error: string } }
  | { ok: true; userId: string; orgId: string } {
  if (!session?.user) {
    return { ok: false, status: 401, body: { error: "Unauthorized" } };
  }
  if (!session.user.isSuperAdmin) {
    return { ok: false, status: 403, body: { error: "Forbidden: Super Admin required" } };
  }
  const userId = session.user.id;
  const orgId = session.user.orgId;
  if (!userId || !orgId) {
    return { ok: false, status: 401, body: { error: "Unauthorized" } };
  }
  return { ok: true, userId, orgId };
}

/**
 * Guard for Server Components.
 * Calls auth() and redirects to / if not a super admin.
 */
export async function assertSuperAdmin() {
  const session = await auth();
  const check = requireSuperAdmin(session);
  if (!check.ok) {
    redirect("/");
  }
  return { userId: check.userId, orgId: check.orgId };
}
