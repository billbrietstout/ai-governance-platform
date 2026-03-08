/**
 * Readiness probe – DB, auth status.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitResponse, withCors } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { limited, retryAfter, headers } = rateLimit({
    anonymousKey: req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "ready"
  });
  if (limited) {
    const res = rateLimitResponse(headers, retryAfter);
    return withCors(res, req.headers.get("origin"));
  }

  let db = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    db = true;
  } catch {
    // DB unreachable
  }

  const auth = !!process.env.AUTH0_CLIENT_ID;

  const res = NextResponse.json({
    status: db && auth ? "ready" : "degraded",
    db,
    auth,
    timestamp: new Date().toISOString()
  });
  for (const [k, v] of Object.entries(headers)) {
    if (v) res.headers.set(k, v);
  }
  return withCors(res, req.headers.get("origin"));
}
