/**
 * Agentic System Registry – AI agents and autonomous systems.
 */
import Link from "next/link";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { AgentsClient } from "./AgentsClient";

export default async function AgentsPage() {
  const caller = await createServerCaller();
  const { data: assets } = await caller.assets.getAgentRegistry({});

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-8 px-6 py-10">
      <div>
        <Link href="/layer3-application/assets" className="text-sm text-navy-600 hover:underline">
          ← AI Assets
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          Agentic System Registry
        </h1>
        <p className="mt-1 text-slate-600">
          AI agents and autonomous systems with autonomy classification and override controls.
        </p>
      </div>

      <AgentsClient initialAssets={assets} />
    </main>
  );
}
