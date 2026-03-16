import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "AI Posture <notifications@aiposture.io>",
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
