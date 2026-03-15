/**
 * Evidence Workbook – CoSAI Appendix A.7 evidence requirements by layer.
 */
import Link from "next/link";
import { EvidenceWorkbookClient } from "./EvidenceWorkbookClient";

export default function EvidenceWorkbookPage() {
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

      <EvidenceWorkbookClient />
    </main>
  );
}
