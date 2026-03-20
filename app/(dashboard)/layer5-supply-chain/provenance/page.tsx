/**
 * Model Provenance – training data lineage and attestation.
 */
import Link from "next/link";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { ProvenanceClient } from "./ProvenanceClient";

export default async function ProvenancePage() {
  const caller = await createServerCaller();
  const [provenanceRes, vendorsRes, highRiskRes] = await Promise.all([
    caller.supplyChain.getProvenanceRecords({}),
    caller.supplyChain.getVendors(),
    (async () => {
      const assets = await caller.assets.list({});
      return assets.data.filter((a) => a.euRiskLevel === "HIGH");
    })()
  ]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-5xl flex-col gap-8 px-6 py-10">
      <div>
        <Link href="/layer5-supply-chain" className="text-navy-600 text-sm hover:underline">
          ← Supply Chain
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          Model Provenance
        </h1>
        <p className="mt-1 text-slate-600">
          Training data lineage, fine-tuning chain, and cryptographic attestation for foundation
          models.
        </p>
      </div>

      <ProvenanceClient
        initialRecords={provenanceRes.data}
        vendors={vendorsRes.data}
        highRiskAssetCount={highRiskRes.length}
      />
    </main>
  );
}
