/**
 * Reports loading – card grid skeleton.
 */
export default function ReportsLoading() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-6 px-6 py-10">
      <div>
        <div className="h-8 w-32 animate-pulse rounded bg-gray-200" />
        <div className="mt-2 h-4 w-80 animate-pulse rounded bg-gray-200" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-lg border border-gray-200 bg-white shadow-sm"
          />
        ))}
      </div>

      <div className="h-20 animate-pulse rounded-lg border border-gray-200 bg-white shadow-sm" />
    </main>
  );
}
