import { Resend } from "resend";

let resend: Resend | null = null;

function getResendClient(): Resend {
  if (!resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
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
  if (!process.env.RESEND_API_KEY) {
    console.log("Email not configured — skipping:", subject);
    return { success: false, reason: "not_configured" as const };
  }

  try {
    const client = getResendClient();
    const { data, error } = await client.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "AI Readiness <notifications@aiposture.io>",
      to,
      subject,
      html,
      text
    });
    return { success: !error, data, error };
  } catch (err) {
    console.error("Email send failed:", err);
    return { success: false, error: err };
  }
}
