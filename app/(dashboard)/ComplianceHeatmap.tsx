"use client";

type HeatmapRow = { framework: string; [key: string]: string | number };

type Props = { data: HeatmapRow[] };

function cellColor(value: number): string {
  if (value === 0) return "bg-slate-200 text-slate-500";
  if (value >= 70) return "bg-emerald-500 text-white";
  if (value >= 30) return "bg-amber-400 text-white";
  return "bg-red-500 text-white";
}

export function ComplianceHeatmap({ data }: Props) {
  const assetTypes = new Set<string>();
  for (const row of data) {
    for (const key of Object.keys(row)) {
      if (key !== "framework") assetTypes.add(key);
    }
  }
  const types = Array.from(assetTypes);

  if (data.length === 0 || types.length === 0) {
    return <p className="text-sm text-slate-500">No data</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-xs">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="py-1.5 pr-2 text-left text-xs font-medium tracking-wide text-slate-500 uppercase">
              Framework
            </th>
            {types.map((t) => (
              <th
                key={t}
                className="px-2 py-1.5 text-center text-xs font-medium tracking-wide text-slate-500 uppercase"
              >
                {t}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.framework} className="border-b border-slate-100 last:border-0">
              <td className="py-1.5 pr-2 font-medium text-slate-700">{row.framework}</td>
              {types.map((t) => {
                const val = Number(row[t]) ?? 0;
                return (
                  <td key={t} className="px-1 py-1">
                    <div
                      className={`rounded border border-white px-2 py-1 text-center font-medium ${cellColor(val)}`}
                      title={`${row.framework} / ${t}: ${val}%`}
                    >
                      {val}%
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-2 flex gap-4 text-[10px] text-slate-500">
        <span className="flex items-center gap-1">
          <span className="h-2 w-4 rounded bg-emerald-500" /> ≥70%
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-4 rounded bg-amber-400" /> 30–70%
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-4 rounded bg-red-500" /> &lt;30%
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-4 rounded bg-slate-200" /> 0%
        </span>
      </div>
    </div>
  );
}
