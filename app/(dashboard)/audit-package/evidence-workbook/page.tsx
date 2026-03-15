/**
 * Evidence Workbook – CoSAI Appendix A.7 evidence requirements by layer.
 */
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UpgradeGate } from "@/components/tiers/UpgradeGate";
import { EvidenceWorkbookClient } from "./EvidenceWorkbookClient";

export default async function EvidenceWorkbookPage() {
  const session = await auth();
  const orgId = (session?.user as { orgId?: string })?.orgId;
  const org = orgId
    ? await prisma.organization.findUnique({
        where: { id: orgId },
        select: { tier: true }
      })
    : null;
  const tier = org?.tier ?? "FREE";

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-8 px-6 py-10">
      <div>
        <Link href="/audit-package" className="text-sm text-navy-600 hover:underline">
          ← Audit Package
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Evidence Workbook</h1>
        <p className="mt-1 text-slate-600">
          CoSAI Appendix A.7 evidence requirements by layer.
        </p>
      </div>

      <UpgradeGate feature="evidence_workbook" tier="PRO" userTier={tier}>
        <EvidenceWorkbookClient />
      </UpgradeGate>
    </main>
  );
}
