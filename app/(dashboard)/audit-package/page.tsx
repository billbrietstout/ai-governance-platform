/**
 * Audit Package Generator – export audit-ready evidence packages.
 */
import Link from "next/link";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { getOrgTier } from "@/lib/tiers/check-tier";
import { UpgradeGate } from "@/components/tiers/UpgradeGate";
import { AuditPackageClient } from "./AuditPackageClient";

export default async function AuditPackagePage() {
  const orgTier = await getOrgTier();
  const caller = await createServerCaller();
  const [assetsRes, regulations] = await Promise.all([
    caller.assets.list({}),
    Promise.resolve([
      { value: "EU_AI_ACT", label: "EU AI Act" },
      { value: "NIST_AI_RMF", label: "NIST AI RMF" },
      { value: "ISO_42001", label: "ISO 42001" },
      { value: "COSAI_SRF", label: "CoSAI SRF" },
      { value: "OWASP_LLM", label: "OWASP Top 10 for LLM" },
      { value: "OWASP_AIVSS", label: "OWASP AIVSS" },
      { value: "SR_11_7", label: "SR 11-7" },
      { value: "CUSTOM", label: "Custom" }
    ])
  ]);

  const assets = assetsRes.data.map((a) => ({
    id: a.id,
    name: a.name,
    euRiskLevel: a.euRiskLevel
  }));

  return (
    <main className="mx-auto flex min-h-dvh max-w-5xl flex-col gap-8 px-6 py-10">
      <div>
        <Link href="/dashboard" className="text-navy-600 text-sm hover:underline">
          ← Posture Overview
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          Audit Package Generator
        </h1>
        <p className="mt-1 text-slate-600">
          Export audit-ready evidence packages for regulators, auditors, and certification bodies.
        </p>
      </div>

      <UpgradeGate
        feature="Audit Packages"
        requiredTier="PRO"
        description="Generate audit-ready evidence packages mapped to the CoSAI framework evidence requirements"
        unlockedBy={[
          "Export evidence by asset or regulation",
          "CoSAI A.7 evidence workbook",
          "Compliance audit trail"
        ]}
        orgTier={orgTier}
      >
        <AuditPackageClient assets={assets} regulations={regulations} />
      </UpgradeGate>
    </main>
  );
}
