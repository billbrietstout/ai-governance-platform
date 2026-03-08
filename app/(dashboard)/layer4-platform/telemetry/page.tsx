/**
 * Telemetry & Monitoring – Layer 4: Platform (MODULE_OPS_INTEL).
 */
import Link from "next/link";

export default function TelemetryPage() {
  return (
    <main className="flex flex-col gap-6">
      <div>
        <Link href="/layer4-platform" className="text-sm text-navy-400 hover:underline">
          ← Layer 4: Platform
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Telemetry & Monitoring</h1>
        <p className="mt-1 text-slatePro-300">Coming soon.</p>
      </div>
    </main>
  );
}
