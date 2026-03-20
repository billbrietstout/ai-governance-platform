/**
 * Snapshot detail view.
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerCaller } from "@/lib/trpc/server-caller";

export default async function SnapshotDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const caller = await createServerCaller();
  const { data: snapshot } = await caller.audit.getSnapshot({ id });
  if (!snapshot) notFound();

  const layerScores = (snapshot.layerScores ?? {}) as Record<string, number>;

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 px-6 py-10">
      <div>
        <Link href="/compliance/snapshots" className="text-navy-600 text-sm hover:underline">
          ← Snapshots
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          Snapshot {new Date(snapshot.createdAt).toLocaleString()}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {snapshot.snapshotType} • {snapshot.frameworkCode ?? "All frameworks"}
        </p>
      </div>

      <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <div className="text-xs text-slate-500">Overall score</div>
            <div className="text-xl font-semibold">{snapshot.overallScore}%</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Evidence completeness</div>
            <div className="text-xl font-semibold">{snapshot.evidenceCompleteness}%</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Assets</div>
            <div className="text-xl font-semibold">{snapshot.assetCount}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Gaps</div>
            <div className="text-xl font-semibold">{snapshot.gapCount}</div>
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-500">Controls</div>
          <div className="text-sm">
            {snapshot.controlsCompliant} / {snapshot.controlsTotal} compliant
          </div>
        </div>
        <div>
          <div className="mb-2 text-xs text-slate-500">Layer scores</div>
          <div className="flex gap-4">
            {["L1", "L2", "L3", "L4", "L5"].map((l) => (
              <div key={l} className="rounded bg-slate-100 px-3 py-1.5 text-sm font-medium">
                {l}: {layerScores[l] ?? 0}%
              </div>
            ))}
          </div>
        </div>
        {snapshot.notes && (
          <div>
            <div className="text-xs text-slate-500">Notes</div>
            <p className="mt-1 text-sm text-slate-700">{snapshot.notes}</p>
          </div>
        )}
        <div className="border-t border-slate-200 pt-3 text-xs text-slate-500">
          Created by {snapshot.creator?.email ?? "—"}
        </div>
      </div>
    </main>
  );
}
