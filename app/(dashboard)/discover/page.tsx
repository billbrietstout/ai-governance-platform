/**
 * Regulation Discovery – landing page with entry points and recent discoveries.
 */
import Link from "next/link";
import { Sparkles, PlusCircle, FileSearch, Layers, BookOpen } from "lucide-react";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { DiscoverClient } from "./DiscoverClient";

export default async function DiscoverPage() {
  const caller = await createServerCaller();
  let discoveries: Awaited<ReturnType<typeof caller.discovery.getDiscoveries>>["data"] = [];
  let assets: Awaited<ReturnType<typeof caller.discovery.getAssetsForReview>>["data"] = [];

  try {
    const [discoveriesRes, assetsRes] = await Promise.all([
      caller.discovery.getDiscoveries({ limit: 3 }),
      caller.discovery.getAssetsForReview()
    ]);
    discoveries = discoveriesRes.data;
    assets = assetsRes.data;
  } catch (err) {
    console.error("Discover page data fetch failed:", err);
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-4xl flex-col gap-8 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Regulation Discovery
        </h1>
        <p className="mt-1 text-slate-600">
          Find out which regulations apply to your planned AI system before you build it.
        </p>
      </div>

      {/* Entry points */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/discover/wizard"
          className="hover:border-navy-300 flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow"
        >
          <div className="bg-navy-100 flex h-14 w-14 shrink-0 items-center justify-center rounded-lg">
            <PlusCircle className="text-navy-600 h-7 w-7" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Discover for a new system</h2>
            <p className="mt-1 text-sm text-slate-600">
              Run the 4-step wizard to identify applicable regulations for a planned AI system.
            </p>
            <span className="text-navy-600 mt-2 inline-block text-sm font-medium">
              Start wizard →
            </span>
          </div>
        </Link>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-slate-100">
              <FileSearch className="h-7 w-7 text-slate-600" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-slate-900">Review existing asset</h2>
              <p className="mt-1 text-sm text-slate-600">
                Run discovery against an existing AI asset&apos;s properties.
              </p>
            </div>
          </div>
          <DiscoverClient assets={assets} className="mt-4" />
        </div>
      </div>

      {/* Planning tools quick links */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/discover/operating-model"
          className="hover:border-navy-300 flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-100">
            <Layers className="h-6 w-6 text-slate-600" />
          </div>
          <div>
            <h3 className="font-medium text-slate-900">Operating Model Selector</h3>
            <p className="text-sm text-slate-600">
              Understand shared responsibility boundaries (IaaS, AI-PaaS, Agent-PaaS, AI-SaaS).
            </p>
            <span className="text-navy-600 mt-1 inline-block text-sm font-medium">View →</span>
          </div>
        </Link>
        <Link
          href="/discover/use-cases"
          className="hover:border-navy-300 flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-100">
            <BookOpen className="h-6 w-6 text-slate-600" />
          </div>
          <div>
            <h3 className="font-medium text-slate-900">AI Use Case Library</h3>
            <p className="text-sm text-slate-600">
              Common use cases with pre-built governance templates.
            </p>
            <span className="text-navy-600 mt-1 inline-block text-sm font-medium">Browse →</span>
          </div>
        </Link>
      </div>

      {/* Recent discoveries */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700">
          <Sparkles className="text-navy-600 h-4 w-4" />
          Recent discoveries
        </h3>
        {discoveries.length === 0 ? (
          <p className="text-sm text-slate-500">
            No discoveries yet. Run the wizard or review an asset to get started.
          </p>
        ) : (
          <ul className="space-y-2">
            {discoveries.map((d) => {
              const results = d.results as { mandatory?: unknown[]; riskScore?: number };
              const mandatoryCount = results?.mandatory?.length ?? 0;
              const assetName = d.asset?.name;
              return (
                <li key={d.id}>
                  <Link
                    href={`/discover/results/${d.id}`}
                    className="flex items-center justify-between rounded border border-slate-200 px-3 py-2 text-sm transition hover:bg-slate-50"
                  >
                    <span className="font-medium text-slate-900">
                      {assetName ? `${assetName} — ` : ""}
                      {new Date(d.createdAt).toLocaleDateString()}
                    </span>
                    <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                      {mandatoryCount} mandatory
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
