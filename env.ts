import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),

    AUTH0_CLIENT_ID: z.string().min(1),
    AUTH0_CLIENT_SECRET: z.string().min(1),
    AUTH0_ISSUER: z.string().url(),

    AUTH_SECRET: z.string().min(1),
    AUTH_URL: z.string().url().optional(),

    SENTRY_DSN: z.string().url().optional(),
    SENTRY_AUTH_TOKEN: z.string().min(1).optional(),

    OTEL_SERVICE_NAME: z.string().min(1).default("ai-governance-platform")
  },
  client: {
    NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional()
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID,
    AUTH0_CLIENT_SECRET: process.env.AUTH0_CLIENT_SECRET,
    AUTH0_ISSUER: process.env.AUTH0_ISSUER,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_URL: process.env.AUTH_URL,
    SENTRY_DSN: process.env.SENTRY_DSN,
    SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
    OTEL_SERVICE_NAME: process.env.OTEL_SERVICE_NAME,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN
  },
  emptyStringAsUndefined: true
});
