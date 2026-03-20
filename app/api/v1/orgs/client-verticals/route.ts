/**
 * Organization client verticals API – multi-vertical selection.
 * ADMIN only.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { withCors } from "@/lib/security";
import type { VerticalKey } from "@/lib/vertical-regulations";

const verticalSchema = z.enum([
  "GENERAL",
  "FINANCIAL_SERVICES",
  "HEALTHCARE",
  "INSURANCE",
  "PUBLIC_SECTOR",
  "ENERGY",
  "HR_SERVICES"
]);

const ClientVerticalsBody = z.object({
  clientVerticals: z.array(verticalSchema)
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
  if (role !== "ADMIN" && role !== "CAIO") {
    return { ok: false, status: 403, body: { error: "Forbidden: ADMIN or CAIO role required" } };
  }
  const orgId = session.user.orgId;
  const userId = session.user.id;
  if (!orgId || !userId) {
    return { ok: false, status: 401, body: { error: "Unauthorized" } };
  }
  return { ok: true, orgId, userId };
}

export async function GET(req: NextRequest) {
  const session = await auth();
  const check = requireAdmin(session);
  if (!check.ok) {
    const res = NextResponse.json(check.body, { status: check.status });
    return withCors(res, req.headers.get("origin"));
  }

  const org = await prisma.organization.findUnique({
    where: { id: check.orgId },
    select: { clientVerticals: true }
  });

  const clientVerticals = (org?.clientVerticals as string[] | null) ?? [];
  const res = NextResponse.json({ clientVerticals });
  return withCors(res, req.headers.get("origin"));
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

  const parsed = ClientVerticalsBody.safeParse(body);
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

  const prev = (org.clientVerticals as string[] | null) ?? [];
  const next = parsed.data.clientVerticals as VerticalKey[];

  await prisma.$transaction(async (tx) => {
    await tx.organization.update({
      where: { id: check.orgId },
      data: { clientVerticals: next as object }
    });
    await tx.auditLog.create({
      data: {
        orgId: check.orgId,
        userId: check.userId,
        action: "UPDATE",
        resourceType: "Organization",
        resourceId: check.orgId,
        prevState: { clientVerticals: prev },
        nextState: { clientVerticals: next }
      }
    });
  });

  const res = NextResponse.json({ clientVerticals: next });
  return withCors(res, req.headers.get("origin"));
}
