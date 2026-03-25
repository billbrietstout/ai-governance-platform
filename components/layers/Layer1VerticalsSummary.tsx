import Link from "next/link";
import { ComplianceRing } from "@/components/assets/ComplianceRing";

type PortfolioVertical = {
  verticalKey: string;
  label: string;
  assetCount: number;
  complianceScore: number;
};

type Props = {
  verticals: PortfolioVertical[];
};

const DOT_COLORS: Record<string, string> = {
  FINANCIAL_SERVICES: "bg-blue-500",
  HEALTHCARE: "bg-rose-500",
  INSURANCE: "bg-violet-500",
  GENERAL: "bg-slate-400",
  PUBLIC_SECTOR: "bg-amber-500",
  ENERGY: "bg-yellow-500",
  HR_SERVICES: "bg-emerald-500",
  AUTOMOTIVE: "bg-slate-600",
  TELECOM: "bg-indigo-500",
  MANUFACTURING: "bg-orange-500",
  RETAIL: "bg-teal-500"
};

export function Layer1VerticalsSummary({ verticals }: Props) {
  if (verticals.length === 0) {
    return (
      <section
        className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
        aria-labelledby="l1-verticals-summary-heading"
      >
        <h2 id="l1-verticals-summary-heading" className="text-sm font-medium text-slate-900">
          Client verticals
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          No industry verticals selected yet. Add them in{" "}
          <Link href="/settings/organization" className="text-navy-600 font-medium hover:underline">
            Organization settings
          </Link>{" "}
          to tailor regulations and see portfolio coverage below.
        </p>
      </section>
    );
  }

  const avgScore =
    verticals.length > 0
      ? Math.round(
          verticals.reduce((s, v) => s + v.complianceScore, 0) / verticals.length
        )
      : 0;

  return (
    <section
      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
      aria-labelledby="l1-verticals-summary-heading"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id="l1-verticals-summary-heading" className="text-sm font-medium text-slate-900">
            Client verticals
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Regulatory scope from your organization profile. Open the{" "}
            <span className="font-medium text-slate-600">Vertical Portfolio</span> tab for full
            detail.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
          <span className="rounded bg-slate-100 px-2 py-1 font-medium text-slate-700">
            {verticals.length} vertical{verticals.length !== 1 ? "s" : ""}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-slate-500">Avg. compliance</span>
            <span className="font-semibold text-slate-800">{avgScore}%</span>
          </span>
          <Link
            href="/settings/organization"
            className="text-navy-600 font-medium hover:underline"
          >
            Edit scope →
          </Link>
        </div>
      </div>

      <ul className="mt-4 space-y-2 sm:grid sm:grid-cols-2 sm:gap-1 sm:space-y-0 lg:grid-cols-3">
        {verticals.map((v) => (
          <li
            key={v.verticalKey}
            className="flex items-center gap-3 rounded-md border border-slate-100 bg-slate-50/80 px-3 py-2"
          >
            <span
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${DOT_COLORS[v.verticalKey] ?? "bg-slate-400"}`}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">{v.label}</p>
              <p className="text-xs text-slate-500">
                {v.assetCount} asset{v.assetCount !== 1 ? "s" : ""} in scope
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <ComplianceRing percentage={v.complianceScore} size={28} strokeWidth={3} />
              <span className="w-8 text-right text-xs font-medium text-slate-700">
                {v.complianceScore}%
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
