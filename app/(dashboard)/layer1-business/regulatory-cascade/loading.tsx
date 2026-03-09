/**
 * Regulatory Cascade loading – list skeleton.
 */
export default function RegulatoryCascadeLoading() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-5xl flex-col gap-6 px-6 py-10">
      <div>
        <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
        <div className="mt-2 h-8 w-56 animate-pulse rounded bg-gray-200" />
        <div className="mt-2 h-4 w-full max-w-2xl animate-pulse rounded bg-gray-200" />
      </div>

      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-9 w-24 animate-pulse rounded bg-gray-200" />
        ))}
      </div>

      {/* List skeleton – 5 items */}
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="h-8 w-8 shrink-0 animate-pulse rounded bg-gray-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-32 animate-pulse rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
