/**
 * Card detail – normalized card viewer.
 * EU AI Act field coverage: green/amber/red per article.
 * Version history with diff view (placeholder).
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { EUCoverageBadge } from "@/components/supply-chain/EUCoverageBadge";
import { CardSyncStatus } from "@/components/supply-chain/CardSyncStatus";
import type { NormalizedCard } from "@/lib/cards/normalizer";

export default async function CardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const caller = await createServerCaller();
  const [cardRes, coverageRes] = await Promise.all([
    caller.supplyChain.getCard({ id }),
    caller.supplyChain.getCardEUCoverage({ id })
  ]);

  if (!cardRes.data) notFound();
  const card = cardRes.data;
  const coverage = coverageRes.data;
  const normalized = card.normalizedContent as NormalizedCard | null;

  return (
    <main className="mx-auto flex min-h-dvh max-w-4xl flex-col gap-6 px-6 py-10">
      <div>
        <Link href="/layer5-supply-chain/cards" className="text-sm text-navy-400 hover:underline">
          ← Card Library
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{card.asset.name}</h1>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-sm text-slatePro-400">{card.cardType}</span>
          <CardSyncStatus status={card.syncStatus} lastSyncedAt={card.lastSyncedAt} />
          <EUCoverageBadge coverage={coverage} />
        </div>
      </div>

      <section>
        <h2 className="mb-2 text-lg font-medium">EU AI Act Coverage</h2>
        <div className="space-y-1 rounded-lg border border-slatePro-700 bg-slatePro-900/30 p-3">
          {coverage.map((r) => (
            <div
              key={`${r.article}-${r.field}`}
              className={`flex items-center justify-between rounded px-2 py-1 ${
                r.covered ? "bg-emerald-500/10 text-emerald-300" : r.required ? "bg-red-500/10 text-red-300" : "bg-slatePro-800/50 text-slatePro-400"
              }`}
            >
              <span>{r.article} – {r.title}</span>
              <span>{r.covered ? "✓" : r.required ? "✗" : "—"}</span>
            </div>
          ))}
        </div>
      </section>

      {normalized && (
        <section>
          <h2 className="mb-2 text-lg font-medium">Normalized Card</h2>
          <div className="space-y-3 rounded-lg border border-slatePro-700 bg-slatePro-900/30 p-4">
            <Field label="Model" value={normalized.modelName ?? ""} />
            <Field label="Version" value={normalized.version ?? ""} />
            <Field label="Organization" value={normalized.organization ?? ""} />
            <Field label="Intended Use" value={normalized.intendedUse ?? ""} />
            <Field label="Out of Scope" value={normalized.outOfScopeUse ?? ""} />
            <Field label="Training Data" value={normalized.trainingData ?? ""} />
            <Field label="Ethics" value={normalized.ethicsConsiderations ?? ""} />
            <Field label="Bias" value={normalized.biasAnalysis ?? ""} />
            <Field label="License" value={normalized.license ?? ""} />
            {(normalized.limitations?.length ?? 0) > 0 && (
              <Field label="Limitations" value={(normalized.limitations ?? []).join(", ")} />
            )}
            {(normalized.knownVulnerabilities?.length ?? 0) > 0 && (
              <Field label="Known Vulnerabilities" value={(normalized.knownVulnerabilities ?? []).join(", ")} />
            )}
            <Field label="Contact" value={normalized.contactInfo ?? ""} />
            <Field label="Last Updated" value={normalized.lastUpdated ?? ""} />
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-lg font-medium">Version History</h2>
        <p className="rounded-lg border border-slatePro-700 bg-slatePro-900/30 p-4 text-sm text-slatePro-400">
          Version history and diff view coming soon.
        </p>
      </section>
    </main>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  if (!value?.trim()) return null;
  return (
    <div>
      <div className="text-xs font-medium text-slatePro-500">{label}</div>
      <div className="text-sm text-slatePro-200">{value}</div>
    </div>
  );
}
