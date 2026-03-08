/**
 * Layer 1 – Business – regulatory cascade and governance overview.
 */
import Link from "next/link";

export default function Layer1BusinessPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Layer 1: Business</h1>
        <p className="mt-1 text-slatePro-300">
          Regulatory cascade, governance, and executive oversight.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/layer1-business/regulatory-cascade"
          className="rounded-lg border border-slatePro-700 bg-slatePro-900/50 p-4 transition hover:border-slatePro-600"
        >
          <div className="text-sm font-medium text-slatePro-400">Regulatory Cascade</div>
          <div className="mt-1 text-slatePro-200">
            See how regulations flow through CoSAI layers and which requirements are met.
          </div>
        </Link>
      </div>
    </main>
  );
}
