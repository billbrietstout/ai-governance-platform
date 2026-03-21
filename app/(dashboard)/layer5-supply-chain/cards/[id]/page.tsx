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
        <Link href="/layer5-supply-chain/cards" className="text-navy-400 text-sm hover:underline">
          ← Card Library
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{card.asset.name}</h1>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-sm text-gray-600">{card.cardType}</span>
          <CardSyncStatus status={card.syncStatus} lastSyncedAt={card.lastSyncedAt} />
          <EUCoverageBadge coverage={coverage} />
        </div>
      </div>

      <section>
        <h2 className="mb-2 text-lg font-medium text-gray-900">EU AI Act Coverage</h2>
        <div className="space-y-1 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
          {coverage.map((r) => (
            <div
              key={`${r.article}-${r.field}`}
              className={`flex items-center justify-between rounded px-3 py-2 ${
                r.covered
                  ? "bg-emerald-50 text-emerald-800"
                  : r.required
                    ? "bg-red-50 text-red-800"
                    : "bg-gray-50 text-gray-600"
              }`}
            >
              <span>
                {r.article} – {r.title}
              </span>
              <span>{r.covered ? "✓" : r.required ? "✗" : "—"}</span>
            </div>
          ))}
        </div>
      </section>

      {normalized && (
        <section>
          <h2 className="mb-2 text-lg font-medium text-gray-900">Normalized Card</h2>
          <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
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
              <Field
                label="Known Vulnerabilities"
                value={(normalized.knownVulnerabilities ?? []).join(", ")}
              />
            )}
            <Field label="Contact" value={normalized.contactInfo ?? ""} />
            <Field label="Last Updated" value={normalized.lastUpdated ?? ""} />
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-lg font-medium text-gray-900">Version History</h2>
        <p className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
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
      <div className="text-xs font-medium text-gray-500">{label}</div>
      <div className="mt-0.5 text-sm leading-relaxed text-gray-900">{value}</div>
    </div>
  );
}
