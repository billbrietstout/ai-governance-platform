/**
 * Gap Analysis loading – skeleton.
 */
export default function GapsLoading() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-6 px-6 py-10">
      <div>
        <div className="h-8 w-48 animate-pulse rounded bg-slatePro-700/60" />
        <div className="mt-2 h-4 w-96 animate-pulse rounded bg-slatePro-700/40" />
      </div>

      <div className="flex gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 w-24 animate-pulse rounded bg-slatePro-700/60" />
        ))}
      </div>

      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg border border-slatePro-700 bg-slatePro-900/30" />
        ))}
      </div>
    </main>
  );
}
