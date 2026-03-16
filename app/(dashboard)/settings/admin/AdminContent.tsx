"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { setOrgTierAction } from "./actions";

const TIERS = ["FREE", "PRO", "CONSULTANT", "ENTERPRISE"] as const;

type Props = {
  currentTier: string;
};

export function AdminContent({ currentTier }: Props) {
  const { update } = useSession();
  const [selectedTier, setSelectedTier] = useState<string>(currentTier);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [pending, setPending] = useState(false);

  const handleApply = async () => {
    setMessage(null);
    setPending(true);
    try {
      await setOrgTierAction(selectedTier as (typeof TIERS)[number]);
      setMessage({ type: "success", text: "Tier updated successfully." });
      await update();
      window.location.reload();
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to update tier."
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Admin</h1>
        <p className="mt-1 text-sm text-slate-600">Demo tier switching and development tools.</p>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-medium text-amber-800">For demo and development only</p>
        <p className="mt-1 text-xs text-amber-700">
          Changing the subscription tier affects feature gates and limits. Use for testing only.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-medium text-slate-900">Subscription Tier</h2>
        <p className="mt-1 text-sm text-slate-600">Current tier: {currentTier}</p>

        <div className="mt-4 flex flex-wrap gap-4">
          {TIERS.map((tier) => (
            <label key={tier} className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="tier"
                value={tier}
                checked={selectedTier === tier}
                onChange={() => setSelectedTier(tier)}
                className="rounded-full border-slate-300 text-navy-600 focus:ring-navy-500"
              />
              <span className="text-sm font-medium text-slate-700">{tier}</span>
            </label>
          ))}
        </div>

        <button
          type="button"
          onClick={handleApply}
          disabled={pending || selectedTier === currentTier}
          className="mt-4 rounded-lg bg-navy-600 px-4 py-2 text-sm font-medium text-white hover:bg-navy-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Applying…" : "Apply tier"}
        </button>

        {message && (
          <div
            className={`mt-4 rounded-lg p-3 text-sm ${
              message.type === "success" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"
            }`}
          >
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}
