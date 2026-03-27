/**
 * Org user invite emails — sent when an admin creates a pending invite.
 */
import { env } from "@/env";
import { sendEmail } from "@/lib/email/resend";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const baseUrl = () =>
  (env.NEXTAUTH_URL ?? env.AUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");

export async function sendOrgInviteEmail(params: {
  to: string;
  orgName: string;
  role: string;
  inviterEmail: string;
  expiresInDays: number;
}) {
  const { to, orgName, role, inviterEmail, expiresInDays } = params;
  const signInUrl = `${baseUrl()}/login`;
  const safeOrg = escapeHtml(orgName);
  const safeRole = escapeHtml(role);
  const safeInviter = escapeHtml(inviterEmail);

  const subject = `You're invited to join ${orgName}`;

  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">
    <div style="background:white;border-radius:12px;padding:24px;border:1px solid #e2e8f0;">
      <div style="font-size:13px;color:#64748b;margin-bottom:8px;">Organization invite</div>
      <h1 style="margin:0 0 16px;font-size:20px;color:#0f172a;">Join ${safeOrg}</h1>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.5;color:#334155;">
        <strong>${safeInviter}</strong> invited you to this workspace with the role
        <strong>${safeRole}</strong>.
      </p>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.5;color:#334155;">
        Sign in with <strong>${escapeHtml(to)}</strong> using the same email address — your account will be linked automatically.
        This invite expires in ${expiresInDays} days.
      </p>
      <a href="${signInUrl}" style="display:inline-block;background:#1e3a5f;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-size:15px;font-weight:600;">
        Sign in to accept
      </a>
      <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;">
        If you did not expect this message, you can ignore it.
      </p>
    </div>
  </div>
</body>
</html>`;

  const text = [
    `You're invited to join ${orgName}.`,
    ``,
    `${inviterEmail} invited you with role ${role}.`,
    ``,
    `Sign in at: ${signInUrl}`,
    `Use this exact email address when logging in: ${to}`,
    ``,
    `This invite expires in ${expiresInDays} days.`
  ].join("\n");

  return sendEmail({ to, subject, html, text });
}
