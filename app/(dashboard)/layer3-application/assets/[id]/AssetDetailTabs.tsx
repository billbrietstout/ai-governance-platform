"use client";

import { useState } from "react";
import Link from "next/link";
import { AccountabilityMatrix } from "@/components/assets/AccountabilityMatrix";
import { AssetTimeline } from "@/components/assets/AssetTimeline";
import { ComplianceRing } from "@/components/assets/ComplianceRing";

const TABS = [
  "Overview",
  "Accountability",
  "Compliance",
  "Risk",
  "Card",
  "Scanning",
  "Audit Trail"
] as const;

type Props = {
  asset: {
    id: string;
    name: string;
    description: string | null;
    assetType: string;
    euRiskLevel: string | null;
    operatingModel: string | null;
    cosaiLayer: string | null;
    autonomyLevel: string | null;
    verticalMarket: string | null;
    status: string;
    owner: { email: string } | null;
  };
  compliance: {
    percentage: number;
    byLayer: Record<string, { score: number; total: number; percentage: number }>;
  };
  accountability: {
    assignments: {
      id: string;
      componentName: string;
      cosaiLayer: string;
      accountableParty: string;
      responsibleParty: string;
      supportingParties?: string[];
    }[];
  };
  risks: { id: string; title: string; status: string; riskScore: number | null }[];
  cards: { id: string; cardType: string }[];
  scanCompliance: { compliant: boolean; score: number; passed: string[]; missing: string[] };
  auditEvents: { id: string; action: string; at: Date; by?: string }[];
  layers: string[];
};

export function AssetDetailTabs({
  asset,
  compliance,
  accountability,
  risks,
  cards,
  scanCompliance,
  auditEvents,
  layers
}: Props) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");

  return (
    <div>
      <div className="border-slatePro-700 flex gap-2 border-b">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm font-medium ${
              tab === t
                ? "border-navy-500 text-navy-400 border-b-2"
                : "text-slatePro-400 hover:text-slatePro-200"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === "Overview" && (
          <div className="border-slatePro-700 bg-slatePro-900/30 space-y-4 rounded-lg border p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <span className="text-slatePro-500">Type</span>
                <div className="text-slatePro-200">{asset.assetType}</div>
              </div>
              <div>
                <span className="text-slatePro-500">Status</span>
                <div className="text-slatePro-200">{asset.status}</div>
              </div>
              <div>
                <span className="text-slatePro-500">Owner</span>
                <div className="text-slatePro-200">{asset.owner?.email ?? "—"}</div>
              </div>
              <div>
                <span className="text-slatePro-500">Layer</span>
                <div className="text-slatePro-200">
                  {asset.cosaiLayer?.replace(/_/g, " ") ?? "—"}
                </div>
              </div>
            </div>
            {asset.description && (
              <div>
                <span className="text-slatePro-500">Description</span>
                <div className="text-slatePro-200 mt-1">{asset.description}</div>
              </div>
            )}
          </div>
        )}

        {tab === "Accountability" && (
          <AccountabilityMatrix assignments={accountability.assignments} layers={layers} />
        )}

        {tab === "Compliance" && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <ComplianceRing percentage={compliance.percentage} />
              <span className="text-slatePro-300">Overall: {compliance.percentage}%</span>
            </div>
            <div className="border-slatePro-700 bg-slatePro-900/30 rounded-lg border p-4">
              <h3 className="mb-2 text-sm font-medium">By Layer</h3>
              <div className="space-y-2">
                {Object.entries(compliance.byLayer).map(([layer, v]) => (
                  <div key={layer} className="flex justify-between text-sm">
                    <span className="text-slatePro-400">{layer}</span>
                    <span className="text-slatePro-200">
                      {v.percentage}% ({v.score}/{v.total})
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <Link
              href={`/assessments/new?assetId=${asset.id}`}
              className="text-navy-400 text-sm hover:underline"
            >
              Start assessment →
            </Link>
          </div>
        )}

        {tab === "Risk" && (
          <div className="space-y-2">
            {risks.length === 0 ? (
              <p className="text-slatePro-500">No risk entries.</p>
            ) : (
              risks.map((r) => (
                <div
                  key={r.id}
                  className="border-slatePro-700 bg-slatePro-900/30 rounded border p-3"
                >
                  <div className="text-slatePro-200 font-medium">{r.title}</div>
                  <div className="text-slatePro-500 text-xs">
                    {r.status} · Score: {r.riskScore ?? "—"}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "Card" && (
          <div>
            {cards.length === 0 ? (
              <p className="text-slatePro-500">
                No artifact cards linked.{" "}
                <Link href="/layer5-supply-chain/cards" className="text-navy-400 hover:underline">
                  Import from Supply Chain
                </Link>
                .
              </p>
            ) : (
              <div className="space-y-2">
                {cards.map((c) => (
                  <Link
                    key={c.id}
                    href={`/layer5-supply-chain/cards/${c.id}`}
                    className="border-slatePro-700 bg-slatePro-900/30 text-navy-400 block rounded border p-3 hover:underline"
                  >
                    {c.cardType}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "Scanning" && (
          <div className="border-slatePro-700 bg-slatePro-900/30 rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <span className="text-slatePro-400">Policy compliance:</span>
              <span className={scanCompliance.compliant ? "text-emerald-700" : "text-amber-700"}>
                {scanCompliance.compliant ? "Compliant" : "Non-compliant"}
              </span>
              <span className="text-slatePro-300">({scanCompliance.score}%)</span>
            </div>
            <div className="text-slatePro-500 mt-2 text-sm">
              Passed: {scanCompliance.passed.join(", ") || "—"}
            </div>
            {scanCompliance.missing.length > 0 && (
              <div className="mt-1 text-sm text-amber-700">
                Missing: {scanCompliance.missing.join(", ")}
              </div>
            )}
          </div>
        )}

        {tab === "Audit Trail" && <AssetTimeline events={auditEvents} />}
      </div>
    </div>
  );
}
