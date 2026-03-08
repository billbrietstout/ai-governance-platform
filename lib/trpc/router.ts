import { z } from "zod";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "./trpc";
import { complianceRouter } from "./routers/compliance.router";
import { riskRouter } from "./routers/risk.router";
import { accountabilityRouter } from "./routers/accountability.router";

export const appRouter = createTRPCRouter({
  healthcheck: publicProcedure
    .input(z.object({ echo: z.string().optional() }).optional())
    .query(({ input }) => ({ ok: true, echo: input?.echo ?? null })),

  compliance: complianceRouter,
  risk: riskRouter,
  accountability: accountabilityRouter
});

export type AppRouter = typeof appRouter;
