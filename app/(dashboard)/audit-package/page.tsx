/**
 * Audit Package Generator – export audit-ready evidence packages.
 */
import Link from "next/link";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { AuditPackageClient } from "./AuditPackageClient";

export default async function AuditPackagePage() {
  const caller = await createServerCaller();
  const [assetsRes, regulations] = await Promise.all([
    caller.assets.list({}),
    Promise.resolve([
      { value: "EU_AI_ACT", label: "EU AI Act" },
      { value: "NIST_AI_RMF", label: "NIST AI RMF" },
      { value: "ISO_42001", label: "ISO 42001" },
      { value: "COSAI_SRF", label: "CoSAI SRF" },
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
        <Link href="/" className="text-sm text-navy-600 hover:underline">
          ← Command Center
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Audit Package Generator</h1>
        <p className="mt-1 text-slate-600">
          Export audit-ready evidence packages for regulators, auditors, and certification bodies.
        </p>
      </div>

      <AuditPackageClient assets={assets} regulations={regulations} />
    </main>
  );
}
