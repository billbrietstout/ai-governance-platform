"use client";

type Props = {
  total: number;
  breakdown?: {
    soc2: number;
    iso27001: number;
    modelCards: number;
    slsa: number;
    vulnDisclosure: number;
    incidentSLA: number;
  };
};

export function VendorAssuranceScore({ total, breakdown }: Props) {
  const pct = Math.round(total * 100);
  const color =
    pct >= 70 ? "text-emerald-600" : pct >= 40 ? "text-amber-600" : "text-red-600";

  return (
    <div className="flex items-center gap-2">
      <span className={`text-lg font-semibold ${color}`}>{pct}%</span>
      {breakdown && (
        <span className="text-xs text-gray-500">
          SOC2 {Math.round(breakdown.soc2 * 100)}% · ISO {Math.round(breakdown.iso27001 * 100)}% · Cards{" "}
          {Math.round(breakdown.modelCards * 100)}%
        </span>
      )}
    </div>
  );
}
