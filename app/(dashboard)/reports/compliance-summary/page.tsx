/**
 * Compliance Summary report – per framework, per CoSAI layer.
 */
import Link from "next/link";
import { createServerCaller } from "@/lib/trpc/server-caller";

export default async function ComplianceSummaryReportPage() {
  const caller = await createServerCaller();
  const { data: map } = await caller.compliance.getRegulationMap({});

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/reports" className="text-sm text-navy-400 hover:underline">
            ← Reports
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Compliance Summary</h1>
        </div>
        <div className="flex gap-2">
          <button className="rounded border border-slatePro-600 px-3 py-1 text-sm text-slatePro-300">
            Export PDF
          </button>
          <button className="rounded border border-slatePro-600 px-3 py-1 text-sm text-slatePro-300">
            Export JSON
          </button>
          <button className="rounded border border-slatePro-600 px-3 py-1 text-sm text-slatePro-300">
            Export CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slatePro-700">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slatePro-700 bg-slatePro-900/50">
              <th className="px-4 py-2 text-left font-medium text-slatePro-300">Framework</th>
              <th className="px-4 py-2 text-left font-medium text-slatePro-300">Layer</th>
              <th className="px-4 py-2 text-left font-medium text-slatePro-300">Controls</th>
            </tr>
          </thead>
          <tbody>
            {map.frameworks.flatMap((f) =>
              Object.entries(map.byLayer)
                .map(([layer, controls]) => {
                  const fwControls = controls.filter((c) => c.frameworkCode === f.code);
                  if (fwControls.length === 0) return null;
                  return (
                    <tr key={`${f.id}-${layer}`} className="border-b border-slatePro-800">
                      <td className="px-4 py-2 text-slatePro-200">{f.name}</td>
                      <td className="px-4 py-2 text-slatePro-200">{layer.replace(/_/g, " ")}</td>
                      <td className="px-4 py-2 text-slatePro-200">{fwControls.length}</td>
                    </tr>
                  );
                })
                .filter(Boolean)
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
