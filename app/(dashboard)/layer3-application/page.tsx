/**
 * Layer 3 – Application – AI asset inventory, accountability, compliance.
 */
import Link from "next/link";

export default function Layer3ApplicationPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-8 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Layer 3: Application</h1>
        <p className="mt-1 text-slatePro-300">
          AI asset inventory, accountability matrix, and compliance assessments.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/layer3-application/assets"
          className="rounded-lg border border-slatePro-700 bg-slatePro-900/50 p-4 transition hover:border-slatePro-600"
        >
          <div className="text-sm font-medium text-slatePro-400">Asset Inventory</div>
          <div className="mt-1 text-slatePro-200">Filterable asset table</div>
        </Link>
        <Link
          href="/layer3-application/accountability"
          className="rounded-lg border border-slatePro-700 bg-slatePro-900/50 p-4 transition hover:border-slatePro-600"
        >
          <div className="text-sm font-medium text-slatePro-400">Accountability</div>
          <div className="mt-1 text-slatePro-200">Cross-asset RACI matrix</div>
        </Link>
        <Link
          href="/layer3-application/gaps"
          className="rounded-lg border border-slatePro-700 bg-slatePro-900/50 p-4 transition hover:border-slatePro-600"
        >
          <div className="text-sm font-medium text-slatePro-400">Gap Analysis</div>
          <div className="mt-1 text-slatePro-200">Compliance gaps by asset</div>
        </Link>
        <Link
          href="/assessments"
          className="rounded-lg border border-slatePro-700 bg-slatePro-900/50 p-4 transition hover:border-slatePro-600"
        >
          <div className="text-sm font-medium text-slatePro-400">Assessments</div>
          <div className="mt-1 text-slatePro-200">Assessment workflow</div>
        </Link>
      </div>
    </main>
  );
}
