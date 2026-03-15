/**
 * Guest Discovery Results – partial results for users who continued without signing up.
 */
import Link from "next/link";
import { GuestResultsClient } from "./GuestResultsClient";

export default function GuestResultsPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-4xl flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Your Discovery Results
        </h1>
        <p className="mt-1 text-slate-600">
          Create a free account to save your assessment and unlock the full governance roadmap.
        </p>
      </div>

      <GuestResultsClient />
    </main>
  );
}
