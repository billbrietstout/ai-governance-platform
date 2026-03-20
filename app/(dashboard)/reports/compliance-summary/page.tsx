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
          <Link href="/reports" className="text-navy-400 text-sm hover:underline">
            ← Reports
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Compliance Summary</h1>
        </div>
        <div className="flex gap-2">
          <button className="border-slatePro-600 text-slatePro-300 rounded border px-3 py-1 text-sm">
            Export PDF
          </button>
          <button className="border-slatePro-600 text-slatePro-300 rounded border px-3 py-1 text-sm">
            Export JSON
          </button>
          <button className="border-slatePro-600 text-slatePro-300 rounded border px-3 py-1 text-sm">
            Export CSV
          </button>
        </div>
      </div>

      <div className="border-slatePro-700 overflow-x-auto rounded-lg border">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-slatePro-700 bg-slatePro-900/50 border-b">
              <th className="text-slatePro-300 px-4 py-2 text-left font-medium">Framework</th>
              <th className="text-slatePro-300 px-4 py-2 text-left font-medium">Layer</th>
              <th className="text-slatePro-300 px-4 py-2 text-left font-medium">Controls</th>
            </tr>
          </thead>
          <tbody>
            {map.frameworks.flatMap((f) =>
              Object.entries(map.byLayer)
                .map(([layer, controls]) => {
                  const fwControls = controls.filter((c) => c.frameworkCode === f.code);
                  if (fwControls.length === 0) return null;
                  return (
                    <tr key={`${f.id}-${layer}`} className="border-slatePro-800 border-b">
                      <td className="text-slatePro-200 px-4 py-2">{f.name}</td>
                      <td className="text-slatePro-200 px-4 py-2">{layer.replace(/_/g, " ")}</td>
                      <td className="text-slatePro-200 px-4 py-2">{fwControls.length}</td>
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
