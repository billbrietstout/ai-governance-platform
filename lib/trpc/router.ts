import { initTRPC } from "@trpc/server";
import { z } from "zod";

import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create();

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

export const appRouter = createTRPCRouter({
  healthcheck: publicProcedure
    .input(z.object({ echo: z.string().optional() }).optional())
    .query(({ input }) => ({ ok: true, echo: input?.echo ?? null }))
});

export type AppRouter = typeof appRouter;

