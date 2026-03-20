"use client";

import Link from "next/link";

export function GuestResultsClient() {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
      <p className="text-slate-700">
        Guest results are now shown inline in the wizard.{" "}
        <Link href="/discover/wizard" className="text-navy-600 font-medium hover:underline">
          Run the discovery wizard
        </Link>{" "}
        to see your results.
      </p>
    </div>
  );
}
