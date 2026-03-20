/**
 * Organization vertical market API – set industry vertical for regulatory profile.
 * ADMIN only.
 */
import type { VerticalMarket } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { withCors } from "@/lib/security";

const VERTICAL_VALUES = [
  "GENERAL",
  "HEALTHCARE",
  "FINANCIAL",
  "INSURANCE",
  "AUTOMOTIVE",
  "RETAIL",
  "MANUFACTURING",
  "PUBLIC_SECTOR",
  "ENERGY"
] as const;

const PatchVerticalBody = z.object({
  verticalMarket: z.enum(VERTICAL_VALUES)
});

function requireAdmin(
  session: { user?: { orgId?: string; id?: string; role?: string } } | null
):
  | { ok: false; status: 401 | 403; body: { error: string } }
  | { ok: true; orgId: string; userId: string } {
  if (!session?.user) {
    return { ok: false, status: 401, body: { error: "Unauthorized" } };
  }
  const role = session.user.role as string;
  if (role !== "ADMIN") {
    return { ok: false, status: 403, body: { error: "Forbidden: ADMIN role required" } };
  }
  const orgId = session.user.orgId;
  const userId = session.user.id;
  if (!orgId || !userId) {
    return { ok: false, status: 401, body: { error: "Unauthorized" } };
  }
  return { ok: true, orgId, userId };
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

  const parsed = PatchVerticalBody.safeParse(body);
  if (!parsed.success) {
    const res = NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
    return withCors(res, req.headers.get("origin"));
  }

  const org = await prisma.organization.findUnique({
    where: { id: check.orgId }
  });
  if (!org) {
    const res = NextResponse.json({ error: "Organization not found" }, { status: 404 });
    return withCors(res, req.headers.get("origin"));
  }

  const prevVertical = org.verticalMarket;
  const newVertical = parsed.data.verticalMarket as VerticalMarket;

  await prisma.$transaction(async (tx) => {
    await tx.organization.update({
      where: { id: check.orgId },
      data: { verticalMarket: newVertical }
    });
    await tx.auditLog.create({
      data: {
        orgId: check.orgId,
        userId: check.userId,
        action: "UPDATE",
        resourceType: "Organization",
        resourceId: check.orgId,
        prevState: { verticalMarket: prevVertical },
        nextState: { verticalMarket: newVertical }
      }
    });
  });

  const res = NextResponse.json({ verticalMarket: newVertical });
  return withCors(res, req.headers.get("origin"));
}
