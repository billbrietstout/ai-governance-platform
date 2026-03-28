import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";

import type { AppRouter } from "./router";

/**
 * Browser-only tRPC client (same-origin cookies). Use for "load more" and client mutations.
 */
export function createBrowserTRPC() {
  return createTRPCProxyClient<AppRouter>({
    links: [
      httpBatchLink({
        url: typeof window !== "undefined" ? `${window.location.origin}/api/trpc` : "/api/trpc"
      })
    ]
  });
}

let _singleton: ReturnType<typeof createBrowserTRPC> | null = null;

export function getTrpcBrowser() {
  if (!_singleton) _singleton = createBrowserTRPC();
  return _singleton;
}
