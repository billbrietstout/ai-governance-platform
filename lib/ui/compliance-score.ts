/**
 * Threshold-based styling for compliance / readiness percentages.
 * < 40% → red, 40–70% → amber, > 70% → green
 */
export function complianceBarBgClass(pct: number): string {
  if (pct < 40) return "bg-red-500";
  if (pct < 70) return "bg-amber-400";
  return "bg-green-500";
}

export function complianceTextClass(pct: number): string {
  if (pct < 40) return "text-red-600";
  if (pct < 70) return "text-amber-600";
  return "text-green-600";
}

/** Heatmap / cell backgrounds (with text contrast) */
export function complianceHeatmapCellClass(value: number): string {
  if (value === 0) return "bg-slate-200 text-slate-500";
  if (value >= 70) return "bg-green-500 text-white";
  if (value >= 40) return "bg-amber-400 text-white";
  return "bg-red-500 text-white";
}

/** Subtle bordered tile for compact % displays (e.g. persona layer cards) */
export function complianceSurfaceClass(pct: number): string {
  if (pct < 40) return "border-red-200 bg-red-50";
  if (pct < 70) return "border-amber-200 bg-amber-50";
  return "border-green-200 bg-green-50";
}
