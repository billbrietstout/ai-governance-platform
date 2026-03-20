/**
 * Card library – type, source, asset link, sync status.
 * Stale cards flagged (>30 days). EU AI Act field coverage per card.
 * Import from HuggingFace (model ID) or GitHub URL.
 */
import Link from "next/link";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { CardSyncStatus } from "@/components/supply-chain/CardSyncStatus";
import { EUCoverageBadge } from "@/components/supply-chain/EUCoverageBadge";
import { mapCardToEURequirements } from "@/lib/cards/eu-ai-act-mapper";
import type { NormalizedCard } from "@/lib/cards/normalizer";
import { EmptyState } from "@/components/EmptyState";
import { importCard } from "./actions";
import { CardImportForm } from "./CardImportForm";

export default async function CardsPage() {
  const caller = await createServerCaller();
  const [{ data: cards }, { data: assets }] = await Promise.all([
    caller.supplyChain.getCards(),
    caller.supplyChain.getAssets()
  ]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Card Library</h1>
          <p className="text-slatePro-300 mt-1">
            Model, data, and app cards with sync status and EU AI Act coverage.
          </p>
        </div>
        <CardImportForm assets={assets} importCardAction={importCard} />
      </div>

      <div className="border-slatePro-700 overflow-x-auto rounded-lg border">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-slatePro-700 bg-slatePro-900/50 border-b">
              <th className="text-slatePro-300 px-4 py-2 text-left font-medium">Type</th>
              <th className="text-slatePro-300 px-4 py-2 text-left font-medium">Source</th>
              <th className="text-slatePro-300 px-4 py-2 text-left font-medium">Asset</th>
              <th className="text-slatePro-300 px-4 py-2 text-left font-medium">Sync</th>
              <th className="text-slatePro-300 px-4 py-2 text-left font-medium">EU Coverage</th>
            </tr>
          </thead>
          <tbody>
            {cards.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-0">
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
              cards.map((card) => (
                <tr key={card.id} className="border-slatePro-800 border-b last:border-0">
                  <td className="text-slatePro-200 px-4 py-2">{card.cardType}</td>
                  <td className="text-slatePro-200 px-4 py-2">
                    {card.sourceFormat ?? "—"}
                    {card.sourceRepo && (
                      <span
                        className="text-slatePro-500 ml-1 inline-block max-w-[120px] truncate text-xs"
                        title={card.sourceRepo}
                      >
                        {card.sourceRepo}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <Link
                      href={`/layer5-supply-chain/cards/${card.id}`}
                      className="text-navy-400 hover:underline"
                    >
                      {card.asset.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2">
                    <CardSyncStatus status={card.syncStatus} lastSyncedAt={card.lastSyncedAt} />
                  </td>
                  <td className="px-4 py-2">
                    <EUCoverageCell card={card} />
                  </td>
                </tr>
              ))
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
  if (!normalized) return <span className="text-slatePro-500">—</span>;
  const coverage = mapCardToEURequirements(
    normalized,
    card.asset.euRiskLevel as "HIGH" | "MINIMAL" | "LIMITED" | "UNACCEPTABLE" | null
  );
  return <EUCoverageBadge coverage={coverage} />;
}
