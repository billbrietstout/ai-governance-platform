"use client";

import { useState } from "react";
import Link from "next/link";
import { MaturityRadarChart, type LayerScores } from "@/components/maturity/MaturityRadarChart";
import { LAYER_LABELS } from "@/lib/maturity/questions";

const LAYER_KEYS = ["L1", "L2", "L3", "L4", "L5"] as const;

type Props = {
  scores: LayerScores;
  targetLevel: number;
  previousScores: LayerScores | null;
};

export function MaturityRadarSection({ scores, targetLevel, previousScores }: Props) {
  const [showPrevious, setShowPrevious] = useState(false);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-slate-700">Current Scores by Layer</h2>
        {previousScores && (
          <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={showPrevious}
              onChange={(e) => setShowPrevious(e.target.checked)}
              className="rounded border-slate-300"
            />
            Previous assessment
          </label>
        )}
      </div>
      <div className="flex justify-center">
        <MaturityRadarChart
          scores={scores}
          targetLevel={targetLevel}
          previousScores={showPrevious ? previousScores : null}
          size={400}
          interactive={true}
        />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {LAYER_KEYS.map((layer) => (
          <Link
            key={layer}
            href={`/maturity/${layer}`}
            className="text-xs text-navy-600 hover:underline"
          >
            {LAYER_LABELS[layer]} →
          </Link>
        ))}
      </div>
    </div>
  );
}
