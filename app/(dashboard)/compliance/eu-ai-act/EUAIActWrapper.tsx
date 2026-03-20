"use client";

import dynamic from "next/dynamic";

const EUAIActClient = dynamic(
  () => import("./EUAIActClient").then((m) => ({ default: m.EUAIActClient })),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse space-y-8">
        <div className="h-20 rounded-lg bg-slate-200" />
        <div className="h-16 rounded-lg bg-slate-200" />
        <div className="h-48 rounded-lg bg-slate-200" />
      </div>
    )
  }
);

type Props = {
  highRiskAssets: { id: string; name: string; euRiskLevel?: string | null }[];
  minimalLimitedCount: number;
  daysUntilDeadline: number;
};

export function EUAIActWrapper(props: Props) {
  return <EUAIActClient {...props} />;
}
