import type { NextRequest } from "next/server";
import type { Session } from "next-auth";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export type TrpcContext = {
  req: NextRequest;
  session: Session | null;
  orgId: string;
  userId: string;
  role: string;
  activeWorkspaceOrgId: string | null;
  isConsultantAccess: boolean;
  consultantOrgId: string | null;
};

export async function createTrpcContext(opts: {
  req: NextRequest;
  session: Session | null;
  workspaceOrgId?: string | null;
}): Promise<TrpcContext> {
  const { req, session } = opts;
  const user = session?.user as { orgId?: string; id?: string; role?: string } | undefined;
  const consultantOrgId = user?.orgId ?? null;
  const userId = user?.id ?? "";
  const role = user?.role ?? "MEMBER";

  let workspaceOrgId =
    opts.workspaceOrgId ??
    req.headers.get("x-workspace-org-id") ??
    (await cookies()).get("workspace-org-id")?.value ??
    null;

  let activeWorkspaceOrgId: string | null = null;
  let isConsultantAccess = false;

  if (workspaceOrgId && consultantOrgId) {
    const workspace = await prisma.consultantWorkspace.findFirst({
      where: {
        consultantOrgId,
        clientOrgId: workspaceOrgId,
        status: "ACTIVE"
      }
    });
    if (workspace) {
      activeWorkspaceOrgId = workspaceOrgId;
      isConsultantAccess = true;
    }
  }

  const effectiveOrgId = activeWorkspaceOrgId ?? consultantOrgId ?? "";

  return {
    req,
    session,
    orgId: effectiveOrgId,
    userId,
    role,
    activeWorkspaceOrgId,
    isConsultantAccess,
    consultantOrgId
  };
}
