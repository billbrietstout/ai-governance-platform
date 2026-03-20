"use client";

type RequirementCoverage = {
  article: string;
  title: string;
  required: boolean;
  covered: boolean;
  field: string;
  value: string;
};

type Props = {
  coverage: RequirementCoverage[];
};

export function EUCoverageBadge({ coverage }: Props) {
  const required = coverage.filter((r) => r.required);
  const covered = required.filter((r) => r.covered);
  const pct = required.length > 0 ? Math.round((covered.length / required.length) * 100) : 100;

  const color =
    pct >= 80
      ? "bg-emerald-500/20 text-emerald-400"
      : pct >= 50
        ? "bg-amber-500/20 text-amber-400"
        : "bg-red-500/20 text-red-400";

  return (
    <span
      className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${color}`}
      title={required.map((r) => `${r.article}: ${r.covered ? "✓" : "✗"}`).join(", ")}
    >
      EU {pct}%
    </span>
  );
}
