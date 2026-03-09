import { z } from "zod";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "./trpc";
import { complianceRouter } from "./routers/compliance.router";
import { riskRouter } from "./routers/risk.router";
import { accountabilityRouter } from "./routers/accountability.router";
import { supplyChainRouter } from "./routers/supply-chain.router";
import { assetsRouter } from "./routers/assets.router";
import { assessmentRouter } from "./routers/assessment.router";
import { dashboardRouter } from "./routers/dashboard.router";
import { onboardingRouter } from "./routers/onboarding.router";
import { executiveDashboardRouter } from "./routers/executive-dashboard.router";

export const appRouter = createTRPCRouter({
  healthcheck: publicProcedure
    .input(z.object({ echo: z.string().optional() }).optional())
    .query(({ input }) => ({ ok: true, echo: input?.echo ?? null })),

  compliance: complianceRouter,
  risk: riskRouter,
  accountability: accountabilityRouter,
  supplyChain: supplyChainRouter,
  assets: assetsRouter,
  assessment: assessmentRouter,
  dashboard: dashboardRouter,
  onboarding: onboardingRouter,
  executiveDashboard: executiveDashboardRouter
});

export type AppRouter = typeof appRouter;
