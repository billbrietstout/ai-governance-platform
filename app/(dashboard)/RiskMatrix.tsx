"use client";

import React from "react";
import Link from "next/link";

type MatrixData = Record<
  string,
  { count: number; risks: { id: string; title: string }[] }
>;

type Props = { data: MatrixData };

export function RiskMatrix({ data }: Props) {
  const impacts = [1, 2, 3, 4, 5];
  const likelihoods = [1, 2, 3, 4, 5];

  return (
    <div>
      <div className="grid grid-cols-6 gap-0.5 text-center text-xs">
        <div />
        {impacts.map((i) => (
          <div key={i} className="py-1 font-medium text-gray-600">
            I{i}
          </div>
        ))}
        {likelihoods.map((l) => (
          <React.Fragment key={l}>
            <div className="py-1 font-medium text-gray-600">
              L{l}
            </div>
            {impacts.map((i) => {
              const key = `${l}-${i}`;
              const cell = data[key] ?? { count: 0, risks: [] };
              const score = l * i;
              const color =
                score >= 20 ? "bg-red-500/50" : score >= 12 ? "bg-amber-500/50" : score >= 6 ? "bg-yellow-500/30" : "bg-gray-200";

              return (
                <Link
                  key={key}
                  href={cell.risks[0] ? `/layer3-application/assets` : "#"}
                  className={`group relative rounded p-1 text-gray-900 ${color} hover:ring-1 hover:ring-navy-500`}
                  title={cell.risks.length > 0 ? cell.risks.map((r) => r.title).join("\n") : "No risks"}
                >
                  {cell.count}
                  {cell.risks.length > 0 && (
                    <span className="pointer-events-none absolute -top-1 -right-1 z-10 hidden max-w-48 rounded border border-gray-200 bg-white p-2 text-left text-xs text-gray-700 shadow-lg group-hover:block">
                      {cell.risks.slice(0, 5).map((r) => (
                        <div key={r.id} className="truncate">
                          {r.title}
                        </div>
                      ))}
                      {cell.risks.length > 5 && (
                        <div className="text-gray-500">+{cell.risks.length - 5} more</div>
                      )}
                    </span>
                  )}
                </Link>
              );
            })}
          </React.Fragment>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="h-2 w-4 rounded bg-gray-200" /> Low (1–5)
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-4 rounded bg-yellow-500/30" /> Medium (6–11)
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-4 rounded bg-amber-500/50" /> High (12–19)
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-4 rounded bg-red-500/50" /> Critical (20–25)
        </span>
      </div>
    </div>
  );
}
