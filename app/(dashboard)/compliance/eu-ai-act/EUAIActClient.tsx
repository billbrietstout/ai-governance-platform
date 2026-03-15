"use client";

import Link from "next/link";
import { Clock, Check, X, Minus } from "lucide-react";

const ARTICLES = [
  { id: "art9", label: "Article 9 — Risk Management", evidenceLink: "/layer3-application/gaps" },
  { id: "art10", label: "Article 10 — Data Governance", evidenceLink: "/layer2-information/governance" },
  { id: "art11", label: "Article 11 — Technical Documentation", evidenceLink: "/layer5-supply-chain/cards" },
  { id: "art13", label: "Article 13 — Transparency", evidenceLink: "/layer3-application/assets" },
  { id: "art14", label: "Article 14 — Human Oversight", evidenceLink: "/layer3-application/agents" },
  { id: "art15", label: "Article 15 — Accuracy & Robustness", evidenceLink: "/layer4-platform/telemetry" },
  { id: "art72", label: "Article 72 — Post-market Surveillance", evidenceLink: "/layer4-platform/telemetry" }
];

type Asset = { id: string; name: string; euRiskLevel?: string | null };

type Props = {
  highRiskAssets: Asset[];
  minimalLimitedCount: number;
  daysUntilDeadline: number;
};

export function EUAIActClient({
  highRiskAssets,
  minimalLimitedCount,
  daysUntilDeadline
}: Props) {
  return (
    <div className="space-y-8">
      {/* Enforcement deadline */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-center gap-3">
          <Clock className="h-6 w-6 text-amber-600" />
          <div>
            <p className="font-medium text-amber-900">Enforcement deadline</p>
            <p className="text-sm text-amber-800">
              {daysUntilDeadline > 0
                ? `${daysUntilDeadline} days until August 2, 2026`
                : "Deadline passed — ensure conformity is complete"}
            </p>
          </div>
        </div>
      </div>

      {/* Not applicable badge */}
      {minimalLimitedCount > 0 && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-700">
            <span className="rounded bg-slate-200 px-2 py-0.5 font-medium">Not yet applicable</span> —{" "}
            {minimalLimitedCount} asset(s) with MINIMAL or LIMITED risk are not subject to full
            conformity assessment.
          </p>
        </div>
      )}

      {/* CE marking checklist */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="font-medium text-slate-900">CE marking readiness checklist</h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-600" />
            Technical documentation prepared
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-600" />
            Risk management system in place
          </li>
          <li className="flex items-center gap-2">
            <Minus className="h-4 w-4 text-slate-400" />
            Conformity assessment completed (per asset)
          </li>
          <li className="flex items-center gap-2">
            <Minus className="h-4 w-4 text-slate-400" />
            EU declaration of conformity signed
          </li>
        </ul>
      </div>

      {/* Per-asset conformity */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="font-medium text-slate-900">High-risk asset conformity</h3>
        {highRiskAssets.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            No HIGH risk assets. Conformity assessment applies to systems classified as high-risk
            under the EU AI Act.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {highRiskAssets.map((asset) => (
              <div
                key={asset.id}
                className="rounded border border-slate-200 bg-slate-50/50 p-4"
              >
                <div className="flex items-center justify-between">
                  <Link
                    href={`/layer3-application/assets/${asset.id}`}
                    className="font-medium text-slate-900 hover:underline"
                  >
                    {asset.name}
                  </Link>
                  <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                    HIGH
                  </span>
                </div>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="py-2 text-left font-medium text-slate-700">Article</th>
                        <th className="py-2 text-center font-medium text-slate-700">Status</th>
                        <th className="py-2 text-left font-medium text-slate-700">Evidence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ARTICLES.map((art) => (
                        <tr key={art.id} className="border-b border-slate-100">
                          <td className="py-2 text-slate-700">{art.label}</td>
                          <td className="py-2 text-center">
                            <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                              In progress
                            </span>
                          </td>
                          <td className="py-2">
                            <Link
                              href={art.evidenceLink}
                              className="text-navy-600 hover:underline"
                            >
                              View evidence →
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Conformity score: ~40% (3 of 7 articles addressed)
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
