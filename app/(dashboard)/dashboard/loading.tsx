export default function DashboardLoading() {
  return (
    <main className="flex animate-pulse flex-col gap-6">
      <div className="h-8 w-48 rounded bg-slate-200" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="h-16 rounded-lg border border-slate-200 bg-white p-3 shadow-sm" />
        ))}
      </div>
      <div className="h-64 rounded-lg border border-slate-200 bg-white" />
      <div className="h-80 rounded-lg border border-slate-200 bg-white" />
    </main>
  );
}
