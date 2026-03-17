export default function DashboardLoading() {
  return (
    <main className="flex flex-col gap-6 animate-pulse">
      <div className="h-8 w-48 rounded bg-slate-200" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm h-16" />
        ))}
      </div>
      <div className="h-64 rounded-lg border border-slate-200 bg-white" />
      <div className="h-80 rounded-lg border border-slate-200 bg-white" />
    </main>
  );
}
