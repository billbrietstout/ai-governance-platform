"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { resetOnboarding } from "./actions";

export function ResetOnboardingForm() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const handleReset = async () => {
    if (!confirm("Reset onboarding? You will be redirected to the onboarding wizard.")) return;
    setIsPending(true);
    try {
      await resetOnboarding();
      router.push("/onboarding");
    } catch {
      setIsPending(false);
    }
  };

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <h3 className="text-sm font-medium text-amber-800">Demo: Reset onboarding</h3>
      <p className="mt-1 text-sm text-amber-700">
        For demo purposes, reset onboarding to run through the wizard again.
      </p>
      <button
        type="button"
        onClick={handleReset}
        disabled={isPending}
        className="mt-3 flex items-center gap-2 rounded bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50"
      >
        <RotateCcw className="h-4 w-4" />
        {isPending ? "Resetting…" : "Reset onboarding"}
      </button>
    </div>
  );
}
