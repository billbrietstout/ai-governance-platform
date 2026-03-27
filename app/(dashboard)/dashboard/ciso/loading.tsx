import { Skeleton } from "@/components/ui/skeleton";

export default function CISODashboardLoading() {
  return (
    <main className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <Skeleton className="mb-4 h-4 w-48" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
        </div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <Skeleton className="mb-3 h-4 w-64" />
        <Skeleton className="mx-auto h-[280px] w-[280px] max-w-full rounded-lg" />
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <Skeleton className="mb-4 h-4 w-40" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-md" />
          ))}
        </div>
      </div>
    </main>
  );
}
