/**
 * Loading skeleton for server-rendered pages.
 */
export function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-64 rounded bg-slate-200" />
      <div className="h-4 w-96 rounded bg-slate-200" />
      <div className="space-y-4">
        <div className="h-24 rounded-lg bg-slate-200" />
        <div className="h-24 rounded-lg bg-slate-200" />
        <div className="h-24 rounded-lg bg-slate-200" />
      </div>
    </div>
  );
}
