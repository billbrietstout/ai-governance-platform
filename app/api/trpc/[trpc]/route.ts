import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { NextRequest } from "next/server";

import { auth } from "@/auth";
import { createTrpcContext } from "@/lib/trpc/context";
import { appRouter } from "@/lib/trpc/router";

async function handler(req: NextRequest) {
  const session = await auth();
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createTrpcContext({ req, session })
  });
}

export { handler as GET, handler as POST };

