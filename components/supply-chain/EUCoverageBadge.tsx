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
      ? "bg-emerald-100 text-emerald-700"
      : pct >= 50
        ? "bg-amber-100 text-amber-700"
        : "bg-red-100 text-red-700";

  return (
    <span
      className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${color}`}
      title={required.map((r) => `${r.article}: ${r.covered ? "✓" : "✗"}`).join(", ")}
    >
      EU {pct}%
    </span>
  );
}
