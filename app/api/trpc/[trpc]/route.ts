import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { NextRequest } from "next/server";

import { createTrpcContext } from "@/lib/trpc/context";
import { appRouter } from "@/lib/trpc/router";

function handler(req: NextRequest) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createTrpcContext({ req })
  });
}

export { handler as GET, handler as POST };

