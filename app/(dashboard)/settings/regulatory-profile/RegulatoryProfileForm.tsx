"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Props = {
  currentVertical: string;
  verticalOptions: { value: string; label: string }[];
};

async function updateVertical(
  _prev: { error?: string; success?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const vertical = formData.get("verticalMarket") as string;
  const res = await fetch("/api/v1/orgs/vertical", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ verticalMarket: vertical })
  });
  const data = (await res.json()) as { error?: string };
  if (!res.ok) return { error: data.error ?? "Failed to save" };
  return { success: true };
}

export function RegulatoryProfileForm({ currentVertical, verticalOptions }: Props) {
  const router = useRouter();
  const [state, formAction] = useActionState(updateVertical, undefined);

  useEffect(() => {
    if (state?.success) router.refresh();
  }, [state?.success, router]);

  return (
    <form action={formAction} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <label htmlFor="vertical" className="block text-sm font-medium text-slate-700">
        Industry Vertical
      </label>
      <select
        id="vertical"
        name="verticalMarket"
        defaultValue={currentVertical}
        className="focus:border-navy-500 focus:ring-navy-500 mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:ring-1 focus:outline-none"
      >
        {verticalOptions.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {state?.error && <p className="mt-2 text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="mt-2 text-sm text-emerald-600">Saved.</p>}
      <button
        type="submit"
        className="bg-navy-600 hover:bg-navy-500 mt-3 rounded px-4 py-2 text-sm font-medium text-white"
      >
        Save
      </button>
    </form>
  );
}
