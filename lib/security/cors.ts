/**
 * CORS – strict allowlist, no wildcard in production.
 * [SEC REVIEW REQUIRED]
 */

import { NextResponse } from "next/server";

const ALLOWED_ORIGINS = (process.env.CORS_ALLOWED_ORIGINS ?? "http://localhost:3000")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const ALLOWED_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];
const ALLOWED_HEADERS = ["Content-Type", "Authorization", "x-requested-with"];

export function corsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin =
    origin && ALLOWED_ORIGINS.includes(origin)
      ? origin
      : process.env.NODE_ENV === "production"
        ? ""
        : ALLOWED_ORIGINS[0] ?? "";

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": ALLOWED_METHODS.join(", "),
    "Access-Control-Allow-Headers": ALLOWED_HEADERS.join(", "),
    "Access-Control-Max-Age": "86400"
  };
}

export function withCors(response: NextResponse, origin: string | null): NextResponse {
  const headers = corsHeaders(origin);
  for (const [k, v] of Object.entries(headers)) {
    if (v) response.headers.set(k, v);
  }
  return response;
}
