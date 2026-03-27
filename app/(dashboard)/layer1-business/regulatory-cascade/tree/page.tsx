/**
 * Regulation impact tree — drill-down by CoSAI layer with attestations.
 */
import Link from "next/link";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { RegulationCascadeTree } from "@/components/compliance/RegulationCascadeTree";

export default async function RegulationImpactTreePage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const framework = sp.framework ?? "EU_AI_ACT";

  const caller = await createServerCaller();
  const [treeRes, mapRes] = await Promise.all([
    caller.compliance.getRegulationImpactTree({ frameworkCode: framework }),
    caller.compliance.getRegulationMap({})
  ]);

  const nodes = treeRes.data;
  const frameworks = mapRes.data.frameworks;

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-6 px-6 py-10">
      <div>
        <Link href="/layer1-business/regulatory-cascade" className="text-navy-600 text-sm hover:underline">
          ← Regulatory Cascade
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          Regulation impact tree
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Parent–child control chain with attestation status by layer ({framework}).
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {frameworks.map((f) => (
          <Link
            key={f.id}
            href={`/layer1-business/regulatory-cascade/tree?framework=${encodeURIComponent(f.code)}`}
            className={`rounded px-3 py-1.5 text-sm font-medium ${
              framework === f.code
                ? "bg-navy-600 text-white"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {f.name}
          </Link>
        ))}
      </div>

      {nodes.length === 0 ? (
        <p className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          No control tree for this framework. Ensure the framework is active for your organization and
          seed data includes parent links (run <code className="font-mono">npx prisma db seed</code>).
        </p>
      ) : (
        <RegulationCascadeTree nodes={nodes} frameworkCode={framework} />
      )}
    </main>
  );
}
