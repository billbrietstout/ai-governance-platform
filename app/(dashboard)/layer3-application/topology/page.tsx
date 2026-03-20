/**
 * Integration Topology – live dependency map across AI assets.
 */
import Link from "next/link";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { TopologyClient } from "./TopologyClient";

export default async function TopologyPage() {
  const caller = await createServerCaller();
  const { data } = await caller.supplyChain.getTopologyData();

  return (
    <main className="mx-auto flex min-h-dvh max-w-7xl flex-col gap-8 px-6 py-10">
      <div>
        <Link href="/layer3-application/assets" className="text-navy-600 text-sm hover:underline">
          ← AI Assets
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          Integration Topology
        </h1>
        <p className="mt-1 text-slate-600">
          Live dependency map across AI assets, data sources, and platform providers.
        </p>
      </div>

      <TopologyClient initialData={data} />
    </main>
  );
}
