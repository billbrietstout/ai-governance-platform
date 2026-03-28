/**
 * Card library – type, source, asset link, sync status.
 * Stale cards flagged (>30 days). EU AI Act field coverage per card.
 * Import from HuggingFace (model ID) or GitHub URL.
 */
import { Fragment } from "react";
import Link from "next/link";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { CardSyncStatus } from "@/components/supply-chain/CardSyncStatus";
import { EUCoverageBadge } from "@/components/supply-chain/EUCoverageBadge";
import { mapCardToEURequirements } from "@/lib/cards/eu-ai-act-mapper";
import type { NormalizedCard } from "@/lib/cards/normalizer";
import { EmptyState } from "@/components/EmptyState";
import { importCard } from "./actions";
import { CardImportForm } from "./CardImportForm";

const CARD_TYPE_ORDER = ["MODEL_CARD", "DATA_CARD", "APP_CARD"] as const;

const CARD_TYPE_LABEL: Record<string, string> = {
  MODEL_CARD: "Model cards",
  DATA_CARD: "Data cards",
  APP_CARD: "App cards"
};

function cardTypeSectionLabel(cardType: string): string {
  return CARD_TYPE_LABEL[cardType] ?? cardType.replace(/_/g, " ");
}

export default async function CardsPage() {
  const caller = await createServerCaller();
  const [{ data: cards }, { data: assets }] = await Promise.all([
    caller.supplyChain.getCards(),
    caller.supplyChain.getAssets()
  ]);

  const byType = cards.reduce(
    (acc, card) => {
      const list = acc[card.cardType] ?? [];
      list.push(card);
      acc[card.cardType] = list;
      return acc;
    },
    {} as Record<string, typeof cards>
  );

  const orderedTypes = [
    ...CARD_TYPE_ORDER.filter((t) => (byType[t]?.length ?? 0) > 0),
    ...Object.keys(byType).filter((k) => !CARD_TYPE_ORDER.includes(k as (typeof CARD_TYPE_ORDER)[number]))
  ];

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Card Library</h1>
          <p className="mt-1 text-slate-600">
            Model, data, and app cards with sync status and EU AI Act coverage.
          </p>
        </div>
        <CardImportForm assets={assets} importCardAction={importCard} />
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left font-medium text-gray-900">Source</th>
              <th className="px-4 py-3 text-left font-medium text-gray-900">Asset</th>
              <th className="px-4 py-3 text-left font-medium text-gray-900">Sync</th>
              <th className="px-4 py-3 text-left font-medium text-gray-900">EU Coverage</th>
            </tr>
          </thead>
          <tbody>
            {cards.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-0">
                  <div className="p-6">
                    <EmptyState
                      title="No cards yet"
                      description="Import model, data, or app cards from HuggingFace or GitHub to track supply chain coverage."
                      ctaLabel="Import Card"
                      ctaHref="/layer5-supply-chain/cards"
                    />
                  </div>
                </td>
              </tr>
            ) : (
              orderedTypes.map((type) => {
                const rows = byType[type];
                if (!rows?.length) return null;
                return (
                  <Fragment key={type}>
                    <tr className="border-b border-gray-200 bg-slate-50/90">
                      <td
                        colSpan={4}
                        className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
                      >
                        {cardTypeSectionLabel(type)}
                      </td>
                    </tr>
                    {rows.map((card) => (
                      <tr
                        key={card.id}
                        className="border-b border-gray-100 transition last:border-0 hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 text-gray-700">
                          {card.sourceFormat ?? "—"}
                          {card.sourceRepo && (
                            <span
                              className="ml-1 inline-block max-w-[180px] truncate text-xs text-gray-500"
                              title={card.sourceRepo}
                            >
                              {card.sourceRepo}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/layer5-supply-chain/cards/${card.id}`}
                            className="text-navy-400 hover:underline"
                          >
                            {card.asset.name}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <CardSyncStatus status={card.syncStatus} lastSyncedAt={card.lastSyncedAt} />
                        </td>
                        <td className="px-4 py-3">
                          <EUCoverageCell card={card} />
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

function EUCoverageCell({
  card
}: {
  card: { normalizedContent: unknown; asset: { euRiskLevel: string | null } };
}) {
  const normalized = card.normalizedContent as NormalizedCard | null;
  if (!normalized) return <span className="text-gray-500">—</span>;
  const coverage = mapCardToEURequirements(
    normalized,
    card.asset.euRiskLevel as "HIGH" | "MINIMAL" | "LIMITED" | "UNACCEPTABLE" | null
  );
  return <EUCoverageBadge coverage={coverage} />;
}
