import { Resend } from "resend";

import { env } from "@/env";

/** Dynamic lookup so the bundler is less likely to inline a missing secret at build time. */
function readRuntimeEnv(name: string): string | undefined {
  const v = process.env[name];
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t.length > 0 ? t : undefined;
}

/**
 * Read Resend credentials at send time (not only from @/env snapshot).
 * On Railway, `RESEND_API_KEY` must be the **token value** (`re_...`) in the
 * web service Variables — the "Name" column in Resend's UI is unrelated.
 * Default `from` uses aireadiness@vstout.com — verify vstout.com in Resend, or set
 * `RESEND_FROM_EMAIL` (e.g. onboarding@resend.dev for testing without a domain).
 */
function resendCredentials(): { apiKey: string | undefined; from: string } {
  const apiKey =
    readRuntimeEnv("RESEND_API_KEY") || env.RESEND_API_KEY?.trim() || undefined;
  const from =
    readRuntimeEnv("RESEND_FROM_EMAIL") ||
    env.RESEND_FROM_EMAIL?.trim() ||
    "AI Readiness Platform <aireadiness@vstout.com>";
  return { apiKey, from };
}

export async function sendEmail({
  to,
  subject,
  html,
  text
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const { apiKey, from } = resendCredentials();
  if (!apiKey) {
    const rawLen = typeof process.env.RESEND_API_KEY === "string" ? process.env.RESEND_API_KEY.length : 0;
    const envLen = env.RESEND_API_KEY ? env.RESEND_API_KEY.length : 0;
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "[email] RESEND_API_KEY missing at runtime — process.env length:",
        rawLen,
        "env() length:",
        envLen,
        "(if both 0: add re_ token to Railway web service Variables and redeploy; check for typo or variable on wrong service)"
      );
    } else {
      console.log("Email not configured — skipping:", subject);
    }
    return { success: false, reason: "not_configured" as const };
  }

  try {
    const client = new Resend(apiKey);
    const { data, error } = await client.emails.send({
      from,
      to,
      subject,
      html,
      text
    });
    if (error) {
      console.error("[resend] emails.send error:", error);
      return { success: false, error };
    }
    if (!data?.id) {
      console.error("[resend] unexpected response (no id):", data);
      return { success: false, error: new Error("Resend returned no message id") };
    }
    return { success: true, data };
  } catch (err) {
    console.error("[resend] send threw:", err);
    return { success: false, error: err };
  }
}
