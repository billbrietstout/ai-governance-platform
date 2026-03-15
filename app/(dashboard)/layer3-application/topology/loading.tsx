/**
 * Integration Topology – loading skeleton.
 */
export default function TopologyLoading() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-7xl flex-col gap-8 px-6 py-10">
      <div>
        <div className="h-5 w-32 animate-pulse rounded bg-slate-200" />
        <div className="mt-2 h-6 w-96 animate-pulse rounded bg-slate-200" />
        <div className="mt-1 h-4 w-80 animate-pulse rounded bg-slate-200" />
      </div>

      <div className="h-12 w-full animate-pulse rounded-lg border border-slate-200 bg-slate-100" />

      <div className="h-[500px] animate-pulse rounded-lg border border-slate-200 bg-slate-50" />
    </main>
  );
}
