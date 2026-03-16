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
import { layer2Router } from "./routers/layer2.router";
import { layer4Router } from "./routers/layer4.router";
import { maturityRouter } from "./routers/maturity.router";
import { userRouter } from "./routers/user.router";
import { discoveryRouter } from "./routers/discovery.router";
import { auditRouter } from "./routers/audit.router";
import { isoReadinessRouter } from "./routers/iso-readiness.router";
import { searchRouter } from "./routers/search.router";
import { orgRouter } from "./routers/org.router";
import { consultantRouter } from "./routers/consultant.router";
import { notificationsRouter } from "./routers/notifications.router";

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
  executiveDashboard: executiveDashboardRouter,
  layer2: layer2Router,
  layer4: layer4Router,
  maturity: maturityRouter,
  user: userRouter,
  discovery: discoveryRouter,
  audit: auditRouter,
  isoReadiness: isoReadinessRouter,
  search: searchRouter,
  org: orgRouter,
  consultant: consultantRouter,
  notifications: notificationsRouter
});

export type AppRouter = typeof appRouter;
