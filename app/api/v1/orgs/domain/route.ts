/**
 * Domain claiming API – set or clear claimedDomain and autoJoinRole.
 * ADMIN only.
 */
import type { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { withCors } from "@/lib/security";

// Domain: letters, dots, hyphens; no @
const DOMAIN_REGEX = /^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/i;

const PatchDomainBody = z.object({
  claimedDomain: z.union([z.string(), z.null()]).optional(),
  autoJoinRole: z.enum(["VIEWER", "ANALYST"]).optional()
});

function requireAdmin(session: { user?: { orgId?: string; id?: string; role?: string } } | null) {
  if (!session?.user) {
    return { ok: false, status: 401, body: { error: "Unauthorized" } };
  }
  const role = session.user.role as string;
  if (role !== "ADMIN") {
    return { ok: false, status: 403, body: { error: "Forbidden: ADMIN role required" } };
  }
  return { ok: true, orgId: session.user.orgId as string, userId: session.user.id as string };
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  const check = requireAdmin(session);
  if (!check.ok) {
    const res = NextResponse.json(check.body, { status: check.status });
    return withCors(res, req.headers.get("origin"));
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    const res = NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    return withCors(res, req.headers.get("origin"));
  }

  const parsed = PatchDomainBody.safeParse(body);
  if (!parsed.success) {
    const res = NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
    return withCors(res, req.headers.get("origin"));
  }

  const { claimedDomain, autoJoinRole } = parsed.data;

  const domainToValidate =
    claimedDomain === undefined ? null : claimedDomain === null || claimedDomain === "" ? null : claimedDomain;
  if (domainToValidate) {
    const normalized = domainToValidate.trim().toLowerCase();
    if (!DOMAIN_REGEX.test(normalized)) {
      const res = NextResponse.json(
        { error: "Invalid domain format: use letters, dots, hyphens only; no @ symbol" },
        { status: 400 }
      );
      return withCors(res, req.headers.get("origin"));
    }
  }

  const org = await prisma.organization.findUnique({
    where: { id: check.orgId }
  });
  if (!org) {
    const res = NextResponse.json({ error: "Organization not found" }, { status: 404 });
    return withCors(res, req.headers.get("origin"));
  }

  const prevDomain = org.claimedDomain;
  const prevRole = org.autoJoinRole;
  const newDomain =
    claimedDomain === undefined
      ? prevDomain
      : claimedDomain === null || claimedDomain === ""
        ? null
        : claimedDomain.trim().toLowerCase();
  const newRole = (autoJoinRole ?? prevRole) as UserRole;

  await prisma.$transaction(async (tx) => {
    await tx.organization.update({
      where: { id: check.orgId },
      data: {
        claimedDomain: newDomain,
        autoJoinRole: newRole
      }
    });
    await tx.auditLog.create({
      data: {
        orgId: check.orgId,
        userId: check.userId,
        action: "UPDATE",
        resourceType: "Organization",
        resourceId: check.orgId,
        prevState: { claimedDomain: prevDomain, autoJoinRole: prevRole },
        nextState: { claimedDomain: newDomain, autoJoinRole: newRole }
      }
    });
  });

  const res = NextResponse.json({
    claimedDomain: newDomain,
    autoJoinRole: newRole
  });
  return withCors(res, req.headers.get("origin"));
}
