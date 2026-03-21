"use client";

type Props = {
  prev: Record<string, unknown>;
  next: Record<string, unknown>;
};

export function CardDiffViewer({ prev, next }: Props) {
  const allKeys = new Set([...Object.keys(prev), ...Object.keys(next)]);
  const changes: { key: string; prev: unknown; next: unknown }[] = [];

  for (const key of allKeys) {
    const p = prev[key];
    const n = next[key];
    if (JSON.stringify(p) !== JSON.stringify(n)) {
      changes.push({ key, prev: p, next: n });
    }
  }

  if (changes.length === 0) {
    return <p className="text-slatePro-400 text-sm">No changes detected.</p>;
  }

  return (
    <div className="space-y-2 text-sm">
      {changes.map(({ key, prev: p, next: n }) => (
        <div key={key} className="border-slatePro-700 bg-slatePro-900/30 rounded border p-2">
          <div className="text-slatePro-300 font-medium">{key}</div>
          <div className="mt-1 grid grid-cols-2 gap-2">
            <div className="rounded bg-red-50 p-1.5 text-red-700 line-through">
              {typeof p === "object" ? JSON.stringify(p) : String(p ?? "")}
            </div>
            <div className="rounded bg-emerald-50 p-1.5 text-emerald-700">
              {typeof n === "object" ? JSON.stringify(n) : String(n ?? "")}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
