/**
 * Prompt Governance – Layer 2: Information (MODULE_SHADOW_AI).
 */
import Link from "next/link";

export default function PromptGovernancePage() {
  return (
    <main className="flex flex-col gap-6">
      <div>
        <Link href="/layer2-information" className="text-sm text-navy-400 hover:underline">
          ← Layer 2: Information
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Prompt Governance</h1>
        <p className="mt-1 text-slatePro-300">Coming soon.</p>
      </div>
    </main>
  );
}
