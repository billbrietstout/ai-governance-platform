import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { withAuth } from "next-auth/middleware";

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/api/auth",
  "/api/ready",
  "/api/v1/invites/accept",
  "/_next",
  "/favicon.ico",
  "/discover",
  "/discover/wizard",
  "/discover/use-cases",
  "/discover/operating-model"
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

export default withAuth(
  function middleware(req: NextRequest & { auth: unknown }) {
    const { pathname } = req.nextUrl;
    const isPublic =
      PUBLIC_PATHS.some((p) => pathname.startsWith(p)) || pathname === "/";

    if (!isPublic && !req.nextauth?.token) {
      const loginUrl = new URL("/login", req.nextUrl.origin);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
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

    return NextResponse.next();
  },
  {
    pages: { signIn: "/login", error: "/login" },
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = (req as NextRequest).nextUrl.pathname;
        const isPublic =
          PUBLIC_PATHS.some((p) => pathname.startsWith(p)) || pathname === "/";
        if (isPublic) return true;
        return !!token;
      }
    }
  }
);

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"]
};
