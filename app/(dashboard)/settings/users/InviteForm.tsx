"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

const ROLES = ["ADMIN", "CAIO", "ANALYST", "MEMBER", "VIEWER", "AUDITOR"] as const;

async function createInvite(
  _prev:
    | {
        error?: string;
        success?: boolean;
        emailSent?: boolean;
        emailSkipReason?: "not_configured" | "provider_error";
      }
    | undefined,
  formData: FormData
) {
  const email = formData.get("email") as string;
  const role = formData.get("role") as string;
  if (!email?.trim()) return { error: "Email is required" };
  if (!ROLES.includes(role as (typeof ROLES)[number])) return { error: "Invalid role" };

  const res = await fetch("/api/v1/invites", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim(), role })
  });
  const data = (await res.json()) as {
    error?: string;
    emailSent?: boolean;
    emailSkipReason?: "not_configured" | "provider_error";
  };

  if (!res.ok) {
    return { error: data.error ?? "Failed to create invite" };
  }
  return {
    success: true,
    emailSent: data.emailSent === true,
    emailSkipReason: data.emailSkipReason
  };
}

export function InviteForm() {
  const router = useRouter();
  const [state, formAction] = useActionState(
    createInvite,
    {} as {
      error?: string;
      success?: boolean;
      emailSent?: boolean;
      emailSkipReason?: "not_configured" | "provider_error";
    }
  );

  useEffect(() => {
    if (state?.success) router.refresh();
  }, [state?.success, router]);

  return (
    <form action={formAction} className="mt-4 space-y-4">
      <div>
        <label htmlFor="invite-email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="invite-email"
          name="email"
          type="email"
          required
          placeholder="colleague@example.com"
          className="focus:border-navy-500 focus:ring-navy-500 mt-1 w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 focus:ring-1 focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="invite-role" className="block text-sm font-medium text-gray-700">
          Role
        </label>
        <select
          id="invite-role"
          name="role"
          className="focus:border-navy-500 focus:ring-navy-500 mt-1 w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-1 focus:outline-none"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && state.emailSent && (
        <p className="text-sm text-emerald-600">Invite sent by email. Expires in 7 days.</p>
      )}
      {state?.success && !state.emailSent && state.emailSkipReason === "provider_error" && (
        <p className="text-sm text-amber-700">
          Invite saved. Resend rejected the email — open <strong>Railway → Deployments → Logs</strong>{" "}
          and search for <code className="rounded bg-amber-100 px-1">[resend]</code>. Typical fixes:
          verify <code className="rounded bg-amber-100 px-1">RESEND_FROM_EMAIL</code> domain in Resend,
          or check API key scope.
        </p>
      )}
      {state?.success && !state.emailSent && state.emailSkipReason === "not_configured" && (
        <p className="text-sm text-amber-700">
          Invite saved. The server still cannot read <code className="rounded bg-amber-100 px-1">RESEND_API_KEY</code>{" "}
          at runtime — check Railway <strong>ai-governance-platform</strong> service → Variables (exact
          name, full <code className="rounded bg-amber-100 px-1">re_</code> value), then redeploy. Logs
          show <code className="rounded bg-amber-100 px-1">[email] RESEND_API_KEY missing</code> with
          length hints.
        </p>
      )}
      {state?.success && !state.emailSent && !state.emailSkipReason && (
        <p className="text-sm text-amber-700">
          Invite saved. Email was not sent — redeploy to pick up the latest diagnostics, or ask the user
          to sign in with this email (invite expires in 7 days).
        </p>
      )}
      <button
        type="submit"
        className="bg-navy-600 hover:bg-navy-500 rounded px-4 py-2 text-sm font-medium text-white"
      >
        Send invite
      </button>
    </form>
  );
}
