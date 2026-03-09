/**
 * Asset Inventory loading – table skeleton.
 */
export default function AssetsLoading() {
  const cols = 8;
  const rows = 8;

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="h-9 w-24 animate-pulse rounded bg-gray-200" />
      </div>

      <div className="h-12 w-full animate-pulse rounded-lg border border-gray-200 bg-white shadow-sm" />

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} className="px-4 py-2">
                  <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, row) => (
              <tr key={row} className="border-b border-gray-200 last:border-0">
                {Array.from({ length: cols }).map((_, col) => (
                  <td key={col} className="px-4 py-2">
                    <div
                      className="h-4 animate-pulse rounded bg-gray-200"
                      style={{ width: col === 0 ? 120 : 60 }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
