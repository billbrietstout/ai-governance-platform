"use client";

import { useState } from "react";
import Link from "next/link";
import { HelpCircle, ExternalLink } from "lucide-react";

type ScoreRow = {
  vendorId: string;
  vendorName: string;
  evidenceCurrency: number;
  contractAligned: boolean | null;
  scanCoverage: number;
  disclosureHistory: number;
  overallScore: number;
  breakdown?: Record<string, number>;
  expiredEvidence?: { type: string; message: string; expiredAt?: Date }[];
};

type Overall = { overallScore: number; rating: string };

type Props = {
  scores: ScoreRow[];
  overall: Overall;
};

function scoreColor(score: number): string {
  if (score < 40) return "bg-red-100 text-red-700";
  if (score <= 70) return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
}

export function RiskScoreClient({ scores, overall }: Props) {
  const [tooltipVendor, setTooltipVendor] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-medium text-slate-700">Overall supply chain risk</h3>
        <div className="mt-2 flex items-center gap-4">
          <span
            className={`rounded px-3 py-1.5 text-lg font-semibold ${scoreColor(overall.overallScore)}`}
          >
            {overall.overallScore}
          </span>
          <span className="text-slate-600">{overall.rating} risk</span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 text-left font-medium text-slate-700">Vendor</th>
              <th className="px-4 py-3 text-right font-medium text-slate-700">Evidence currency</th>
              <th className="px-4 py-3 text-center font-medium text-slate-700">Contract aligned</th>
              <th className="px-4 py-3 text-right font-medium text-slate-700">Scan coverage</th>
              <th className="px-4 py-3 text-right font-medium text-slate-700">Disclosure history</th>
              <th className="px-4 py-3 text-right font-medium text-slate-700">Overall score</th>
              <th className="px-4 py-3 text-center font-medium text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {scores.map((row) => (
              <tr key={row.vendorId} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{row.vendorName}</td>
                <td className="px-4 py-3 text-right">{row.evidenceCurrency}%</td>
                <td className="px-4 py-3 text-center">
                  {row.contractAligned ? (
                    <span className="text-emerald-600">Yes</span>
                  ) : (
                    <span className="text-red-600">No</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">{row.scanCoverage}%</td>
                <td className="px-4 py-3 text-right">{row.disclosureHistory}%</td>
                <td className="px-4 py-3 text-right">
                  <div className="relative inline-block">
                    <span
                      className={`rounded px-2 py-0.5 font-medium ${scoreColor(row.overallScore)}`}
                    >
                      {row.overallScore}
                    </span>
                    <button
                      type="button"
                      onMouseEnter={() => setTooltipVendor(row.vendorId)}
                      onMouseLeave={() => setTooltipVendor(null)}
                      className="ml-1 inline text-slate-400 hover:text-slate-600"
                    >
                      <HelpCircle className="h-4 w-4" />
                    </button>
                    {tooltipVendor === row.vendorId && (
                      <div className="absolute bottom-full left-0 z-10 mb-1 w-64 rounded border border-slate-200 bg-white p-3 text-left shadow-lg">
                        <p className="text-xs font-medium text-slate-700">Score breakdown</p>
                        <ul className="mt-1 space-y-0.5 text-xs text-slate-600">
                          <li>Evidence currency: {row.evidenceCurrency}% (25% weight)</li>
                          <li>Contract alignment: {row.contractAligned ? 100 : 0}% (20% weight)</li>
                          <li>Scan coverage: {row.scanCoverage}% (25% weight)</li>
                          <li>Assurance posture: (30% weight)</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <Link
                    href={`/layer5-supply-chain/vendors/${row.vendorId}?improve=1`}
                    className="inline-flex items-center gap-1 text-navy-600 hover:underline"
                  >
                    Improve score
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {scores.length === 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center text-slate-500">
          No vendors. Add vendors to see risk scores.
        </div>
      )}

      {scores.some((s) => s.expiredEvidence && s.expiredEvidence.length > 0) && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h3 className="font-medium text-amber-800">Missing or expired evidence</h3>
          <p className="mt-1 text-sm text-amber-700">
            Some vendors have expired evidence. Use &quot;Improve score&quot; to see what evidence is missing or expired.
          </p>
        </div>
      )}
    </div>
  );
}
