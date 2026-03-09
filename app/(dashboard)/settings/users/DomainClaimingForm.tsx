"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

type DomainClaimingFormProps = {
  claimedDomain: string | null;
  autoJoinRole: "VIEWER" | "ANALYST";
};

async function saveDomain(
  _prev: { error?: string; success?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const claimedDomainRaw = formData.get("claimedDomain");
  const claimedDomain =
    claimedDomainRaw === null || (typeof claimedDomainRaw === "string" && claimedDomainRaw.trim() === "")
      ? null
      : (claimedDomainRaw as string).trim();
  const autoJoinRole = formData.get("autoJoinRole") as string;

  const res = await fetch("/api/v1/orgs/domain", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      claimedDomain,
      autoJoinRole: autoJoinRole === "VIEWER" || autoJoinRole === "ANALYST" ? autoJoinRole : "VIEWER"
    })
  });
  const data = (await res.json()) as { error?: string };

  if (!res.ok) {
    return { error: data.error ?? "Failed to save" };
  }
  return { success: true };
}

export function DomainClaimingForm({ claimedDomain, autoJoinRole }: DomainClaimingFormProps) {
  const router = useRouter();
  const [state, formAction] = useActionState(saveDomain, undefined);

  useEffect(() => {
    if (state?.success) router.refresh();
  }, [state?.success, router]);

  return (
    <form action={formAction} className="mt-4 space-y-4">
      <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
        <p className="text-sm font-medium text-amber-800">
          Anyone with this email domain can join your organization
        </p>
        <p className="mt-1 text-sm text-gray-600">
          {claimedDomain
            ? `Users signing in with an @${claimedDomain} address will be automatically added with the selected role.`
            : "Set a domain below to allow anyone with that email domain to auto-join. Leave blank to disable."}
        </p>
      </div>

      <div>
        <label htmlFor="domain-claimedDomain" className="block text-sm font-medium text-gray-700">
          Claimed domain
        </label>
        <input
          id="domain-claimedDomain"
          name="claimedDomain"
          type="text"
          placeholder="example.com"
          defaultValue={claimedDomain ?? ""}
          className="mt-1 w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
        />
        <p className="mt-1 text-xs text-gray-500">Letters, dots, hyphens only. No @ symbol.</p>
      </div>

      <div>
        <label htmlFor="domain-autoJoinRole" className="block text-sm font-medium text-gray-700">
          Auto-join role
        </label>
        <select
          id="domain-autoJoinRole"
          name="autoJoinRole"
          defaultValue={autoJoinRole}
          className="mt-1 w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
        >
          <option value="VIEWER">VIEWER</option>
          <option value="ANALYST">ANALYST</option>
        </select>
        <p className="mt-1 text-xs text-gray-500">ADMIN and CAIO cannot be auto-assigned.</p>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-emerald-600">Domain settings saved.</p>}

      <button
        type="submit"
        className="rounded bg-navy-600 px-4 py-2 text-sm font-medium text-white hover:bg-navy-500"
      >
        Save
      </button>
    </form>
  );
}
