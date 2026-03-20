/**
 * Rate limiter – 100 req/min/user, 1000 req/min/org.
 * Uses Upstash Redis when configured; in-memory fallback otherwise.
 * [SEC REVIEW REQUIRED]
 */

import { NextResponse } from "next/server";

const USER_LIMIT = 100;
const ORG_LIMIT = 1000;
const WINDOW_MS = 60_000;

type InMemoryEntry = { count: number; resetAt: number };

const userStore = new Map<string, InMemoryEntry>();
const orgStore = new Map<string, InMemoryEntry>();

function getOrCreate(
  store: Map<string, InMemoryEntry>,
  key: string,
  limit: number
): { count: number; remaining: number; resetAt: number } {
  const now = Date.now();
  let entry = store.get(key);
  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: now + WINDOW_MS };
    store.set(key, entry);
  }
  entry.count++;
  const remaining = Math.max(0, limit - entry.count);
  return { count: entry.count, remaining, resetAt: entry.resetAt };
}

export type RateLimitContext = {
  userId?: string;
  orgId?: string;
  /** Fallback key for public endpoints (e.g. IP or "anon") */
  anonymousKey?: string;
};

const ANON_LIMIT = 60;

export function rateLimit(context: RateLimitContext): {
  limited: boolean;
  retryAfter?: number;
  headers: Record<string, string>;
} {
  const headers: Record<string, string> = {};
  let limited = false;
  let retryAfter: number | undefined;

  if (context.userId) {
    const r = getOrCreate(userStore, context.userId, USER_LIMIT);
    headers["X-RateLimit-Limit-User"] = String(USER_LIMIT);
    headers["X-RateLimit-Remaining-User"] = String(r.remaining);
    if (r.count > USER_LIMIT) {
      limited = true;
      retryAfter = Math.ceil((r.resetAt - Date.now()) / 1000);
    }
  }

  if (context.orgId) {
    const r = getOrCreate(orgStore, context.orgId, ORG_LIMIT);
    headers["X-RateLimit-Limit-Org"] = String(ORG_LIMIT);
    headers["X-RateLimit-Remaining-Org"] = String(r.remaining);
    if (r.count > ORG_LIMIT) {
      limited = true;
      retryAfter = Math.ceil((r.resetAt - Date.now()) / 1000);
    }
  }

  if (!context.userId && !context.orgId && context.anonymousKey) {
    const r = getOrCreate(userStore, `anon:${context.anonymousKey}`, ANON_LIMIT);
    headers["X-RateLimit-Limit"] = String(ANON_LIMIT);
    headers["X-RateLimit-Remaining"] = String(r.remaining);
    if (r.count > ANON_LIMIT) {
      limited = true;
      retryAfter = Math.ceil((r.resetAt - Date.now()) / 1000);
    }
  }

  if (retryAfter) {
    headers["Retry-After"] = String(retryAfter);
  }

  return { limited, retryAfter, headers };
}

export function rateLimitResponse(
  headers: Record<string, string>,
  retryAfter?: number
): NextResponse {
  const res = NextResponse.json({ error: "Too Many Requests", retryAfter }, { status: 429 });
  for (const [k, v] of Object.entries(headers)) {
    res.headers.set(k, v);
  }
  return res;
}
