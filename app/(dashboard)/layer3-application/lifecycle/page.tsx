/**
 * Application Lifecycle – governed transitions from development to production.
 */
import Link from "next/link";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { LifecycleClient } from "./LifecycleClient";

export default async function LifecyclePage() {
  const caller = await createServerCaller();
  const { data: board } = await caller.assets.getLifecycleBoard();

  return (
    <main className="mx-auto flex min-h-dvh max-w-7xl flex-col gap-8 px-6 py-10">
      <div>
        <Link href="/layer3-application/assets" className="text-navy-600 text-sm hover:underline">
          ← AI Assets
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          Application Lifecycle
        </h1>
        <p className="mt-1 text-slate-600">Governed transitions from development to production.</p>
      </div>

      <LifecycleClient board={board} />
    </main>
  );
}
