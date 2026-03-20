/**
 * Evidence Workbook – CoSAI Appendix A.7 evidence requirements by layer.
 */
import Link from "next/link";
import { getOrgTier } from "@/lib/tiers/check-tier";
import { UpgradeGate } from "@/components/tiers/UpgradeGate";
import { EvidenceWorkbookClient } from "./EvidenceWorkbookClient";

export default async function EvidenceWorkbookPage() {
  const orgTier = await getOrgTier();

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-8 px-6 py-10">
      <div>
        <Link href="/audit-package" className="text-navy-600 text-sm hover:underline">
          ← Audit Package
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          Evidence Workbook
        </h1>
        <p className="mt-1 text-slate-600">CoSAI Appendix A.7 evidence requirements by layer.</p>
      </div>

      <UpgradeGate
        feature="Evidence Workbook"
        requiredTier="PRO"
        description="Layer-by-layer evidence requirements aligned to CoSAI A.7 specifications"
        unlockedBy={[
          "Required artifacts per layer",
          "Evidence gap analysis",
          "Auditor-ready documentation"
        ]}
        orgTier={orgTier}
      >
        <EvidenceWorkbookClient />
      </UpgradeGate>
    </main>
  );
}
