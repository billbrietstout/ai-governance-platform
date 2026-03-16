import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { createTrpcContext } from "@/lib/trpc/context";
import { appRouter } from "@/lib/trpc/router";
import { rateLimit, rateLimitResponse, withCors } from "@/lib/security";

async function handler(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { orgId?: string; id?: string } | undefined;
  const { limited, retryAfter, headers } = rateLimit({
    userId: user?.id,
    orgId: user?.orgId,
    anonymousKey: !user ? (req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "trpc") : undefined
  });
  if (limited) {
    const res = rateLimitResponse(headers, retryAfter);
    return withCors(res, req.headers.get("origin"));
  }

  const response = await fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () =>
      createTrpcContext({
        req,
        session: session as import("next-auth").Session | null
      })
  });

  for (const [k, v] of Object.entries(headers)) {
    if (v) response.headers.set(k, v);
  }
  return withCors(response as NextResponse, req.headers.get("origin"));
}

export { handler as GET, handler as POST };

export async function OPTIONS(req: NextRequest) {
  const res = new NextResponse(null, { status: 204 });
  return withCors(res, req.headers.get("origin"));
}

