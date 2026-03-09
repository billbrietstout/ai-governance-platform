"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

const ROLES = ["ADMIN", "CAIO", "ANALYST", "MEMBER", "VIEWER", "AUDITOR"] as const;

async function createInvite(_prev: { error?: string; success?: boolean } | undefined, formData: FormData) {
  const email = formData.get("email") as string;
  const role = formData.get("role") as string;
  if (!email?.trim()) return { error: "Email is required" };
  if (!ROLES.includes(role as (typeof ROLES)[number])) return { error: "Invalid role" };

  const res = await fetch("/api/v1/invites", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim(), role })
  });
  const data = (await res.json()) as { error?: string };

  if (!res.ok) {
    return { error: data.error ?? "Failed to create invite" };
  }
  return { success: true };
}

export function InviteForm() {
  const router = useRouter();
  const [state, formAction] = useActionState(createInvite, {} as { error?: string; success?: boolean });

  useEffect(() => {
    if (state?.success) router.refresh();
  }, [state?.success, router]);

  return (
    <form action={formAction} className="mt-4 space-y-4">
      <div>
        <label htmlFor="invite-email" className="block text-sm font-medium text-slatePro-400">
          Email
        </label>
        <input
          id="invite-email"
          name="email"
          type="email"
          required
          placeholder="colleague@example.com"
          className="mt-1 w-full rounded border border-slatePro-700 bg-slatePro-950 px-3 py-2 text-slatePro-200 placeholder-slatePro-500 focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
        />
      </div>
      <div>
        <label htmlFor="invite-role" className="block text-sm font-medium text-slatePro-400">
          Role
        </label>
        <select
          id="invite-role"
          name="role"
          className="mt-1 w-full rounded border border-slatePro-700 bg-slatePro-950 px-3 py-2 text-slatePro-200 focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
      {state?.error && (
        <p className="text-sm text-red-400">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-sm text-emerald-400">Invite sent. Expires in 7 days.</p>
      )}
      <button
        type="submit"
        className="rounded bg-navy-600 px-4 py-2 text-sm font-medium text-white hover:bg-navy-500"
      >
        Send invite
      </button>
    </form>
  );
}
