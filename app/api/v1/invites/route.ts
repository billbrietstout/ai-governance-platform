/**
 * Invite management API – create, list, revoke pending invites.
 * ADMIN only. All operations scoped to caller's org.
 */
import type { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";

import { auth } from "@/auth";
import { sendOrgInviteEmail } from "@/lib/email/org-invite";
import { prisma } from "@/lib/prisma";
import { withCors } from "@/lib/security";

export const runtime = "nodejs";

const ROLES: UserRole[] = ["ADMIN", "CAIO", "ANALYST", "MEMBER", "VIEWER", "AUDITOR"];
const INVITE_EXPIRY_DAYS = 7;

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

export async function GET(req: NextRequest) {
  const session = await auth();
  const check = requireAdmin(session);
  if (!check.ok) {
    const res = NextResponse.json(check.body, { status: check.status });
    return withCors(res, req.headers.get("origin"));
  }

  const invites = await prisma.pendingInvite.findMany({
    where: { orgId: check.orgId },
    orderBy: { createdAt: "desc" }
  });

  const res = NextResponse.json({ invites });
  return withCors(res, req.headers.get("origin"));
}

const CreateInviteBody = z.object({
  email: z.string().email(),
  role: z.enum(ROLES as unknown as [string, ...string[]])
});

export async function POST(req: NextRequest) {
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

  const parsed = CreateInviteBody.safeParse(body);
  if (!parsed.success) {
    const res = NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
    return withCors(res, req.headers.get("origin"));
  }

  const { email, role } = parsed.data;
  const orgId = check.orgId;
  const userId = check.userId;

  const existingUser = await prisma.user.findFirst({
    where: { orgId, email }
  });
  if (existingUser) {
    const res = NextResponse.json(
      { error: "User already exists in this organization" },
      { status: 409 }
    );
    return withCors(res, req.headers.get("origin"));
  }

  const existingInvite = await prisma.pendingInvite.findFirst({
    where: { orgId, email, expiresAt: { gt: new Date() } }
  });
  if (existingInvite) {
    const res = NextResponse.json(
      { error: "Pending invite already exists for this email" },
      { status: 409 }
    );
    return withCors(res, req.headers.get("origin"));
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);

  const invite = await prisma.pendingInvite.create({
    data: {
      orgId,
      email,
      role: role as UserRole,
      invitedBy: userId,
      token,
      expiresAt
    }
  });

  const [org, inviter] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: orgId },
      select: { name: true }
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }
    })
  ]);

  const emailResult = await sendOrgInviteEmail({
    to: email,
    orgName: org?.name ?? "your organization",
    role,
    inviterEmail: inviter?.email ?? "An administrator",
    expiresInDays: INVITE_EXPIRY_DAYS
  });
  if (!emailResult.success && emailResult.reason !== "not_configured") {
    console.error("Invite email failed:", emailResult.error ?? emailResult);
  }

  const emailSkipReason = emailResult.success
    ? undefined
    : "reason" in emailResult && emailResult.reason === "not_configured"
      ? ("not_configured" as const)
      : ("provider_error" as const);

  const res = NextResponse.json(
    {
      id: invite.id,
      email: invite.email,
      role: invite.role,
      expiresAt: invite.expiresAt.toISOString(),
      emailSent: emailResult.success === true,
      emailSkipReason
    },
    { status: 201 }
  );
  return withCors(res, req.headers.get("origin"));
}

const RevokeInviteBody = z.object({
  id: z.string().min(1)
});

export async function DELETE(req: NextRequest) {
  const session = await auth();
  const check = requireAdmin(session);
  if (!check.ok) {
    const res = NextResponse.json(check.body, { status: check.status });
    return withCors(res, req.headers.get("origin"));
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const parsed = RevokeInviteBody.safeParse({ id: id ?? "" });
  if (!parsed.success) {
    const res = NextResponse.json({ error: "Missing or invalid invite id" }, { status: 400 });
    return withCors(res, req.headers.get("origin"));
  }

  const invite = await prisma.pendingInvite.findFirst({
    where: { id: parsed.data.id, orgId: check.orgId }
  });
  if (!invite) {
    const res = NextResponse.json({ error: "Invite not found" }, { status: 404 });
    return withCors(res, req.headers.get("origin"));
  }

  await prisma.pendingInvite.delete({ where: { id: invite.id } });

  const res = NextResponse.json({ ok: true });
  return withCors(res, req.headers.get("origin"));
}
