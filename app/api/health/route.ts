/**
 * Health check – status, version, timestamp.
 */
import { NextRequest, NextResponse } from "next/server";
import { rateLimit, rateLimitResponse, withCors } from "@/lib/security";

export const dynamic = "force-dynamic";

const VERSION = process.env.npm_package_version ?? "0.1.0";

export async function GET(req: NextRequest) {
  const { limited, retryAfter, headers } = rateLimit({
    anonymousKey: req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "health"
  });
  if (limited) {
    const res = rateLimitResponse(headers, retryAfter);
    return withCors(res, req.headers.get("origin"));
  }
  const res = NextResponse.json({
    status: "healthy",
    version: VERSION,
    timestamp: new Date().toISOString()
  });
  for (const [k, v] of Object.entries(headers)) {
    if (v) res.headers.set(k, v);
  }
  return withCors(res, req.headers.get("origin"));
}
