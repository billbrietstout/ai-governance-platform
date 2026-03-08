import { initTRPC, TRPCError } from "@trpc/server";

import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create();

const enforceAuth = t.middleware(({ ctx, next }) => {
  const session = ctx.session;
  const user = session?.user as { orgId?: string; id?: string; role?: string } | undefined;
  if (!session || !user?.orgId || !user?.id) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
  }
  return next({ ctx: { ...ctx, session, orgId: user.orgId, userId: user.id, role: user.role ?? "MEMBER" } });
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(enforceAuth);
export const createCallerFactory = t.createCallerFactory;
