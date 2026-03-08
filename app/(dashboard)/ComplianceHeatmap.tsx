"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";

type HeatmapRow = { framework: string; [key: string]: string | number };

type Props = { data: HeatmapRow[] };

export function ComplianceHeatmap({ data }: Props) {
  const assetTypes = new Set<string>();
  for (const row of data) {
    for (const key of Object.keys(row)) {
      if (key !== "framework") assetTypes.add(key);
    }
  }
  const types = Array.from(assetTypes);

  const chartData = data.flatMap((row) =>
    types.map((t) => ({
      name: `${row.framework} / ${t}`,
      value: Number(row[t]) ?? 0,
      framework: row.framework
    }))
  );

  if (chartData.length === 0) {
    return <p className="text-sm text-slatePro-500">No data</p>;
  }

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" />
          <YAxis type="category" dataKey="name" width={120} stroke="#94a3b8" tick={{ fontSize: 10 }} />
          <Tooltip
            contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}
            formatter={(value) => [`${value ?? 0}%`, "Compliance"]}
          />
          <Bar dataKey="value" radius={2}>
            {chartData.map((entry, i) => (
              <Cell
                key={i}
                fill={
                  entry.value >= 80
                    ? "#10b981"
                    : entry.value >= 50
                      ? "#f59e0b"
                      : "#ef4444"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
