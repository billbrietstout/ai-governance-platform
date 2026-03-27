"use client";

import { complianceTextClass } from "@/lib/ui/compliance-score";

type Props = {
  total: number;
  breakdown?: {
    soc2: number;
    iso27001: number;
    modelCards: number;
    slsa: number;
    vulnDisclosure: number;
    incidentSLA: number;
    vra?: number;
  };
};

export function VendorAssuranceScore({ total, breakdown }: Props) {
  const pct = Math.round(total * 100);

  return (
    <div className="flex min-w-0 flex-col items-end gap-0.5 sm:flex-row sm:items-center sm:gap-2">
      <span className={`text-lg font-semibold ${complianceTextClass(pct)}`}>{pct}%</span>
      {breakdown && (
        <span className="max-w-[12rem] truncate text-right text-xs text-slate-500 sm:max-w-none">
          SOC2 {Math.round(breakdown.soc2 * 100)}% · ISO {Math.round(breakdown.iso27001 * 100)}% ·
          Cards {Math.round(breakdown.modelCards * 100)}%
        </span>
      )}
    </div>
  );
}
