/**
 * Server-side tRPC caller for use in Server Components.
 */
import { auth } from "@/lib/auth";
import { cookies } from "next/headers";
import { createTrpcContext } from "./context";
import { createCallerFactory } from "./trpc";
import { appRouter } from "./router";

const createCaller = createCallerFactory(appRouter);

export async function createServerCaller() {
  const session = await auth();
  const workspaceOrgId = (await cookies()).get("workspace-org-id")?.value ?? null;
  const ctx = await createTrpcContext({
    req: new Request("http://localhost") as unknown as import("next/server").NextRequest,
    session,
    workspaceOrgId
  });
  return createCaller(ctx);
}
