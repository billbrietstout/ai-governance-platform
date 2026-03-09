/**
 * Vendor Registry – card layout with assurance metrics.
 */
import Link from "next/link";
import { Building } from "lucide-react";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { EmptyState } from "@/components/EmptyState";

function daysUntil(date: Date | null): number | null {
  if (!date) return null;
  const now = new Date();
  const d = new Date(date);
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function Soc2Badge({ status, expiresAt }: { status: string | null; expiresAt: Date | null }) {
  if (!status || status === "NOT_APPLICABLE") return <span className="text-slatePro-500">—</span>;
  const expired = expiresAt && expiresAt < new Date();
  if (status === "CERTIFIED")
    return (
      <span className={`rounded px-2 py-0.5 text-xs font-medium ${expired ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"}`}>
        {expired ? "EXPIRED" : "CERTIFIED"}
      </span>
    );
  if (status === "IN_PROGRESS")
    return (
      <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-400">
        IN PROGRESS
      </span>
    );
  return <span className="text-slatePro-500">{status}</span>;
}

function SlsaDots({ level }: { level: string | null }) {
  if (!level) return <span className="text-slatePro-500">—</span>;
  const l = parseInt(String(level).replace("L", ""), 10) || 0;
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={`h-1.5 w-1.5 rounded-full ${i <= l ? "bg-navy-400" : "bg-slatePro-600"}`}
        />
      ))}
    </div>
  );
}

export default async function VendorsPage() {
  const caller = await createServerCaller();
  const { data } = await caller.supplyChain.getVendors();

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Vendor Registry</h1>
        <p className="mt-1 text-slatePro-300">
          Vendor assurance scores, evidence expiry, and contract alignment.
        </p>
      </div>

      {data.length === 0 ? (
        <EmptyState
          title="No vendors registered"
          description="Vendors are added via Supply Chain setup. Configure vendor assurance in Layer 5."
          ctaLabel="View Supply Chain"
          ctaHref="/layer5-supply-chain"
          icon={<Building className="h-8 w-8" />}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((v) => {
            const initial = v.vendorName.charAt(0).toUpperCase();
            const scorePct = Math.round(v.assuranceScore.total * 100);
            const daysToExpiry = daysUntil(v.soc2ExpiresAt ?? v.nextReviewAt);
            const expiryWarning = daysToExpiry !== null && daysToExpiry < 90 && daysToExpiry > 0;

            return (
              <Link
                key={v.id}
                href={`/layer5-supply-chain/vendors/${v.id}`}
                className="rounded-lg border border-slatePro-700 bg-slatePro-900/50 p-4 transition hover:border-slatePro-600 hover:bg-slatePro-900/70"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-navy-500/20 text-lg font-semibold text-navy-300">
                    {initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-slatePro-200">{v.vendorName}</h3>
                    <p className="text-xs text-slatePro-500">{v.vendorType ?? "—"}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Soc2Badge status={v.soc2Status} expiresAt={v.soc2ExpiresAt} />
                  <span
                    className={`rounded px-2 py-0.5 text-xs ${
                      v.iso27001Status === "CERTIFIED"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : v.iso27001Status === "IN_PROGRESS"
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-slatePro-700/50 text-slatePro-500"
                    }`}
                  >
                    ISO {v.iso27001Status ?? "—"}
                  </span>
                  <div className="flex items-center gap-1">
                    <SlsaDots level={v.slsaLevel} />
                    <span className="text-[10px] text-slatePro-500">SLSA</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className={v.contractAligned ? "text-emerald-400" : "text-amber-400"}>
                    {v.contractAligned ? "Contract aligned" : "Contract gap"}
                  </span>
                  {daysToExpiry !== null && (
                    <span className={`text-xs ${expiryWarning ? "text-amber-400" : "text-slatePro-500"}`}>
                      {daysToExpiry > 0 ? `${daysToExpiry}d to expiry` : "Expired"}
                    </span>
                  )}
                </div>

                {v.expiredEvidence.length > 0 && (
                  <p className="mt-2 text-xs text-amber-400">{v.expiredEvidence.length} expired evidence</p>
                )}

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-slatePro-500">Assurance</span>
                  <div className="relative h-8 w-8">
                    <svg className="h-8 w-8 -rotate-90" viewBox="0 0 32 32">
                      <circle
                        cx="16"
                        cy="16"
                        r="14"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        className="text-slatePro-700"
                      />
                      <circle
                        cx="16"
                        cy="16"
                        r="14"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeDasharray={`${(scorePct / 100) * 88} 88`}
                        className={scorePct >= 70 ? "text-emerald-500" : scorePct >= 40 ? "text-amber-500" : "text-red-500"}
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-slatePro-200">
                      {scorePct}%
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
