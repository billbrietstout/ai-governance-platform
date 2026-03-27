import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/** Railway / templates often set AUTH0_DOMAIN (host only); NextAuth needs a full issuer URL. */
function resolveAuth0Issuer(): string | undefined {
  const issuer = process.env.AUTH0_ISSUER?.trim();
  if (issuer) return issuer;
  const domain = process.env.AUTH0_DOMAIN?.trim();
  if (!domain) return undefined;
  const host = domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return `https://${host}/`;
}

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),

    AUTH0_CLIENT_ID: z.string().min(1),
    AUTH0_CLIENT_SECRET: z.string().min(1),
    /** Full issuer URL, or derive from AUTH0_DOMAIN (e.g. `tenant.auth0.com` → `https://tenant.auth0.com/`) */
    AUTH0_ISSUER: z.string().url(),
    /** Host or URL; used only if AUTH0_ISSUER is unset (common on Railway) */
    AUTH0_DOMAIN: z.string().optional(),
    AUTH0_MGMT_CLIENT_ID: z.string().min(1).optional(),
    AUTH0_MGMT_CLIENT_SECRET: z.string().min(1).optional(),

    AUTH_SECRET: z.string().min(1),
    /** Public app URL — many hosts set this; NextAuth also reads process.env.NEXTAUTH_URL */
    AUTH_URL: z.string().url().optional(),
    NEXTAUTH_URL: z.string().url().optional(),

    SENTRY_DSN: z.string().url().optional(),
    SENTRY_AUTH_TOKEN: z.string().min(1).optional(),

    OTEL_SERVICE_NAME: z.string().min(1).default("ai-governance-platform"),

    SCAN_WEBHOOK_API_KEY: z.string().min(1).optional(),

    RESEND_API_KEY: z.string().min(1).optional(),
    RESEND_FROM_EMAIL: z.string().optional(),
    CRON_SECRET: z.string().min(16).optional(),

    UPSTASH_REDIS_REST_URL: z.string().url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().optional()
  },
  client: {
    NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional()
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID,
    AUTH0_CLIENT_SECRET: process.env.AUTH0_CLIENT_SECRET,
    AUTH0_ISSUER: resolveAuth0Issuer(),
    AUTH0_DOMAIN: process.env.AUTH0_DOMAIN,
    AUTH0_MGMT_CLIENT_ID: process.env.AUTH0_MGMT_CLIENT_ID,
    AUTH0_MGMT_CLIENT_SECRET: process.env.AUTH0_MGMT_CLIENT_SECRET,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_URL: process.env.AUTH_URL,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    SENTRY_DSN: process.env.SENTRY_DSN,
    SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
    OTEL_SERVICE_NAME: process.env.OTEL_SERVICE_NAME,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    SCAN_WEBHOOK_API_KEY: process.env.SCAN_WEBHOOK_API_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    CRON_SECRET: process.env.CRON_SECRET,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN
  },
  emptyStringAsUndefined: true
});
