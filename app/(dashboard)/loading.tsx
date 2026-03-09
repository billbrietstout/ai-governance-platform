/**
 * Dashboard default loading state – full-page skeleton.
 */
export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Page title skeleton */}
      <div className="h-8 w-64 animate-pulse rounded bg-gray-200" />

      {/* KPI card grid – 8 cards matching dashboard layout */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-lg border border-gray-200 bg-white shadow-sm"
          />
        ))}
      </div>

      {/* Two-column section: heatmap + risk matrix */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-64 animate-pulse rounded-lg border border-gray-200 bg-white shadow-sm" />
        <div className="h-64 animate-pulse rounded-lg border border-gray-200 bg-white shadow-sm" />
      </div>

      {/* Two-column section: cascade + gaps */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-32 animate-pulse rounded-lg border border-gray-200 bg-white shadow-sm" />
        <div className="h-32 animate-pulse rounded-lg border border-gray-200 bg-white shadow-sm" />
      </div>

      {/* Loading indicator */}
      <div className="flex items-center justify-center py-8">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    </div>
  );
}
