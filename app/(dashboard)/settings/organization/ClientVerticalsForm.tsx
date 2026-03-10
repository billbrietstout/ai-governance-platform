"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { VerticalKey } from "@/lib/vertical-regulations";

type VerticalOption = {
  key: VerticalKey;
  label: string;
  description: string;
  regulations: { code: string; name: string }[];
};

type Props = {
  currentVerticals: VerticalKey[];
  verticalOptions: VerticalOption[];
};

async function updateClientVerticals(
  _prev: { error?: string; success?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const selected = formData.getAll("vertical") as string[];
  const res = await fetch("/api/v1/orgs/client-verticals", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientVerticals: selected })
  });
  const data = (await res.json()) as { error?: string };
  if (!res.ok) return { error: data.error ?? "Failed to save" };
  return { success: true };
}

export function ClientVerticalsForm({ currentVerticals, verticalOptions }: Props) {
  const router = useRouter();
  const [state, formAction] = useActionState(updateClientVerticals, undefined);

  useEffect(() => {
    if (state?.success) router.refresh();
  }, [state?.success, router]);

  return (
    <form action={formAction} className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-medium text-slate-700">Client Verticals</h2>
        <p className="mt-1 text-sm text-slate-600">
          Select the industry verticals your organization operates in or serves. We&apos;ll surface
          the relevant AI regulations for each vertical.
        </p>
        <div className="mt-4 space-y-3">
          {verticalOptions.map((opt) => (
            <label
              key={opt.key}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 transition hover:bg-slate-50"
            >
              <input
                type="checkbox"
                name="vertical"
                value={opt.key}
                defaultChecked={currentVerticals.includes(opt.key)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-navy-600 focus:ring-navy-500"
              />
              <div className="flex-1">
                <span className="font-medium text-slate-900">{opt.label}</span>
                {opt.description && (
                  <p className="mt-0.5 text-xs text-slate-500">{opt.description}</p>
                )}
                {opt.regulations.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {opt.regulations.slice(0, 4).map((r) => (
                      <span
                        key={r.code}
                        className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600"
                        title={r.name}
                      >
                        {r.code}
                      </span>
                    ))}
                    {opt.regulations.length > 4 && (
                      <span className="text-[10px] text-slate-500">
                        +{opt.regulations.length - 4} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            </label>
          ))}
        </div>
        {state?.error && <p className="mt-3 text-sm text-red-600">{state.error}</p>}
        {state?.success && <p className="mt-3 text-sm text-emerald-600">Saved.</p>}
        <button
          type="submit"
          className="mt-4 rounded bg-navy-600 px-4 py-2 text-sm font-medium text-white hover:bg-navy-500"
        >
          Save
        </button>
      </div>
    </form>
  );
}
