"use client";

import {
  getSharedDomainsSummary,
  getEfficiencyScore,
  type RegulationForChord
} from "@/lib/discovery/regulation-domains";

const JURISDICTION_COLORS: Record<string, string> = {
  EU: "#185FA5",
  US: "#D85A30",
  US_STATE: "#EF9F27",
  US_LOCAL: "#EF9F27",
  INTERNATIONAL: "#1D9E75"
};

function getJurisdictionColor(jurisdiction: string): string {
  const normalized = jurisdiction?.toUpperCase().replace(/-/g, "_") ?? "";
  return JURISDICTION_COLORS[normalized] ?? JURISDICTION_COLORS.INTERNATIONAL;
}

type Props = {
  regulations: RegulationForChord[];
};

export function SharedControlsSummary({ regulations }: Props) {
  if (regulations.length < 2) return null;

  const shared = getSharedDomainsSummary(regulations);
  const efficiency = getEfficiencyScore(regulations);

  if (shared.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-2 text-sm font-medium text-slate-700">Shared control domains</h3>
        <p className="text-sm text-slate-500">No control domains are shared across 2+ regulations.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-medium text-slate-700">Shared control domains</h3>
      <p className="mb-3 text-xs text-slate-500">
        Implement once, satisfy many — control domains that appear in multiple regulations.
      </p>
      <ul className="space-y-3">
        {shared.map(({ domain, regulations: regs }) => (
          <li key={domain} className="rounded border border-slate-100 p-3">
            <div className="font-medium text-slate-900">{domain}</div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {regs.map((r) => (
                <span
                  key={r.code}
                  className="rounded border px-2 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: `${getJurisdictionColor(r.jurisdiction)}20`,
                    borderColor: `${getJurisdictionColor(r.jurisdiction)}60`,
                    color: getJurisdictionColor(r.jurisdiction)
                  }}
                >
                  {r.code}
                </span>
              ))}
            </div>
            <p className="mt-1 text-xs text-emerald-600">
              Satisfies {regs.length} regulation{regs.length !== 1 ? "s" : ""} with one implementation
            </p>
          </li>
        ))}
      </ul>
      <div className="mt-4 rounded bg-slate-50 px-3 py-2">
        <p className="text-sm font-medium text-slate-700">
          Total efficiency score: {efficiency}% of required controls satisfy multiple regulations
        </p>
      </div>
    </div>
  );
}
