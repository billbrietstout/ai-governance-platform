import { Skeleton } from "@/components/ui/skeleton";

/**
 * CAIO Unified View — loading skeleton (KPIs + maturity + cross-layer + gaps).
 */
export default function CAIODashboardLoading() {
  return (
    <main className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          >
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <Skeleton className="mb-3 h-4 w-40" />
          <Skeleton className="mx-auto h-[280px] w-[280px] max-w-full rounded-lg" />
          <Skeleton className="mx-auto mt-3 h-3 w-48" />
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <Skeleton className="mb-4 h-5 w-48" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-36 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <Skeleton className="mb-3 h-5 w-40" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-md" />
          ))}
        </div>
      </div>
    </main>
  );
}
