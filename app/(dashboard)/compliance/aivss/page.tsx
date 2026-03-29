/**
 * OWASP AIVSS – Agentic AI Vulnerability Scoring System reference and factor list.
 */
import Link from "next/link";
import { getOrgTier } from "@/lib/tiers/check-tier";
import { UpgradeGate } from "@/components/tiers/UpgradeGate";
import { AIVSSClient } from "./AIVSSClient";

export default async function AivssPage() {
  const orgTier = await getOrgTier();

  return (
    <main className="mx-auto flex min-h-dvh max-w-4xl flex-col gap-8 px-6 py-10">
      <div>
        <Link href="/compliance/snapshots" className="text-navy-600 text-sm hover:underline">
          ← Compliance
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          OWASP AIVSS (Agentic AI Vulnerability Scoring)
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Assessment dimensions for agentic AI: base severity plus amplification factors that inform a 0–10
          composite score. Controls are seeded for attestation and gap analysis alongside other frameworks.
        </p>
      </div>

      <UpgradeGate
        feature="AIVSS reference"
        requiredTier="PRO"
        description="Agentic scoring dimensions and alignment with OWASP LLM Top 10"
        unlockedBy={[
          "Nine AIVSS amplification and oversight dimensions",
          "Cross-links to OWASP LLM items where applicable",
          "CoSAI layer mapping for secure-by-design reviews"
        ]}
        orgTier={orgTier}
      >
        <AIVSSClient />
      </UpgradeGate>
    </main>
  );
}
