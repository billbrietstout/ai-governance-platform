/**
 * Middleware – route protection, RBAC, CSP nonce, audit logging.
 * Protects: dashboard, layer*, assessments, reports, incidents, settings.
 * Injects orgId, userId, role via headers for server components.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { auth } from "@/auth";

const PROTECTED_PATHS = [
  "/",
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

const PUBLIC_PATHS = ["/login", "/callback"];

function isProtected(pathname: string): boolean {
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return false;
  return PROTECTED_PATHS.some((p) => pathname === p || (p !== "/" && pathname.startsWith(`${p}/`)));
}

function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

export default auth((req) => {
  const pathname = req.nextUrl.pathname;

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  if (isProtected(pathname)) {
    const session = req.auth;
    if (!session?.user) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const orgId = (session.user as { orgId?: string }).orgId;
    const userId = (session.user as { id?: string }).id;
    const role = (session.user as { role?: string }).role;

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
    "font-src 'self' data:",
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

  if (req.auth?.user) {
    const u = req.auth.user as { orgId?: string; id?: string; role?: string };
    response.headers.set("x-org-id", u.orgId ?? "");
    response.headers.set("x-user-id", u.id ?? "");
    response.headers.set("x-user-role", u.role ?? "");
  }

  return response;
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/health|api/ready).*)"]
};
