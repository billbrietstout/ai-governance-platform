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
    <div className="grid grid-cols-6 gap-0.5 text-center text-xs">
      <div />
      {impacts.map((i) => (
        <div key={i} className="py-1 font-medium text-slatePro-400">
          I{i}
        </div>
      ))}
      {likelihoods.map((l) => (
        <React.Fragment key={l}>
          <div className="py-1 font-medium text-slatePro-400">
            L{l}
          </div>
          {impacts.map((i) => {
            const key = `${l}-${i}`;
            const cell = data[key] ?? { count: 0, risks: [] };
            const score = l * i;
            const color =
              score >= 20 ? "bg-red-500/40" : score >= 12 ? "bg-amber-500/40" : score >= 6 ? "bg-yellow-500/20" : "bg-slatePro-700/50";

            return (
              <Link
                key={key}
                href={cell.risks[0] ? `/layer3-application/assets` : "#"}
                className={`rounded p-1 ${color} hover:ring-1 hover:ring-navy-500`}
                title={cell.risks.map((r) => r.title).join(", ")}
              >
                {cell.count}
              </Link>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
}
