/**
 * Proxy – route protection, RBAC, CSP nonce, audit logging.
 * Protects: dashboard, layer*, assessments, reports, incidents, settings.
 * Injects orgId, userId, role via headers for server components.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { withAuth } from "next-auth/middleware";

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

const rateLimitMap = new Map<string, { count: number; reset: number }>();

function rateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.reset) {
    rateLimitMap.set(ip, { count: 1, reset: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) =>
    p === "/" ? pathname === "/" : pathname.startsWith(p)
  );
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
  function proxyHandler(req) {
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

    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    if (pathname.startsWith("/api/v1/invites")) {
      if (!rateLimit(ip, 5, 60 * 60 * 1000)) {
        return new NextResponse("Too many requests", { status: 429 });
      }
    }
    if (pathname.startsWith("/discover")) {
      if (!rateLimit(ip, 20, 60 * 60 * 1000)) {
        return new NextResponse("Too many requests", { status: 429 });
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
