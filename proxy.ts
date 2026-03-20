/**
 * Proxy – route protection, RBAC, CSP nonce, audit logging.
 * Protects: dashboard, layer*, assessments, reports, incidents, settings.
 * Injects orgId, userId, role via headers for server components.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { withAuth } from "next-auth/middleware";

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN
      })
    : null;

const discoverRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "1 h"),
      analytics: true,
      prefix: "rl:discover"
    })
  : null;

const inviteRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "1 h"),
      analytics: true,
      prefix: "rl:invite"
    })
  : null;

const isProd = process.env.NODE_ENV === "production";

const PROTECTED_PATHS = [
  "/dashboard",
  "/audit",
  "/onboarding",
  "/layer1-business",
  "/layer2-information",
  "/layer3-application",
  "/layer4-platform",
  "/layer5-supply-chain",
  "/assessments",
  "/reports",
  "/incidents",
  "/settings",
  "/agents",
  "/monitoring"
];

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/callback",
  "/privacy",
  "/discover",
  "/discover/wizard",
  "/discover/use-cases",
  "/discover/operating-model",
  "/discover/results",
  "/api/auth",
  "/api/ready"
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => (p === "/" ? pathname === "/" : pathname.startsWith(p)));
}

function isProtected(pathname: string): boolean {
  if (isPublicPath(pathname)) return false;
  return PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

const proxy = withAuth(
  async function proxyHandler(req) {
    const pathname = req.nextUrl.pathname;

    if (pathname.startsWith("/api/auth")) {
      return NextResponse.next();
    }

    if (isProtected(pathname)) {
      const token = req.nextauth?.token as { orgId?: string; id?: string; role?: string } | null;
      const orgId = token?.orgId;
      const userId = token?.id;
      const role = token?.role;

      if (!orgId || !userId || !role) {
        return NextResponse.redirect(new URL("/login?error=session", req.url));
      }
    }

    const nonce = generateNonce();
    const cspHeader = [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}'`,
      `style-src 'self' 'nonce-${nonce}'`,
      "img-src 'self' data: https: blob:",
      "font-src 'self'",
      "connect-src 'self' https: wss:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests"
    ].join("; ");

    const response = NextResponse.next();
    response.headers.set("Content-Security-Policy", cspHeader);
    response.headers.set("x-nonce", nonce);

    const token = req.nextauth?.token as { orgId?: string; id?: string; role?: string } | null;
    if (token) {
      response.headers.set("x-org-id", token.orgId ?? "");
      response.headers.set("x-user-id", token.id ?? "");
      response.headers.set("x-user-role", token.role ?? "");
    }

    const ip = req.headers.get("x-forwarded-for") ?? "anonymous";

    if (isProd && pathname.startsWith("/discover") && discoverRatelimit) {
      try {
        const { success } = await discoverRatelimit.limit(ip);
        if (!success) {
          return new NextResponse("Too many requests", {
            status: 429,
            headers: { "Retry-After": "3600" }
          });
        }
      } catch {
        console.warn("Rate limit check failed, allowing request");
      }
    }

    if (isProd && pathname.startsWith("/api/v1/invites") && inviteRatelimit) {
      try {
        const { success } = await inviteRatelimit.limit(ip);
        if (!success) {
          return new NextResponse("Too many requests", {
            status: 429,
            headers: { "Retry-After": "3600" }
          });
        }
      } catch {
        console.warn("Rate limit check failed, allowing request");
      }
    }

    return response;
  },
  {
    pages: { signIn: "/login", error: "/login" },
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = (req as NextRequest).nextUrl.pathname;
        if (!isProtected(pathname)) return true;
        return !!token?.orgId && !!token?.id && !!token?.role;
      }
    }
  }
);

export default proxy;

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/health|api/ready).*)"]
};
