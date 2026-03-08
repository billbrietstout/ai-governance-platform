/**
 * Accountability Matrix report – CoSAI RACI across all assets.
 */
import Link from "next/link";
import { createServerCaller } from "@/lib/trpc/server-caller";

export default async function AccountabilityMatrixReportPage() {
  const caller = await createServerCaller();
  const { data } = await caller.accountability.getCrossAssetMatrix({});

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/reports" className="text-sm text-navy-400 hover:underline">
            ← Reports
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Accountability Matrix</h1>
        </div>
        <div className="flex gap-2">
          <button className="rounded border border-slatePro-600 px-3 py-1 text-sm text-slatePro-300">Export CSV</button>
        </div>
      </div>

      <div className="space-y-4">
        {data.assets.map((asset) => {
          const assignments = data.byAsset[asset.id] ?? [];
          return (
            <div key={asset.id} className="rounded-lg border border-slatePro-700 bg-slatePro-900/30 p-4">
              <Link href={`/layer3-application/assets/${asset.id}`} className="font-medium text-navy-400 hover:underline">
                {asset.name}
              </Link>
              <div className="mt-2 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slatePro-700">
                      <th className="px-2 py-1 text-left text-slatePro-500">Layer</th>
                      <th className="px-2 py-1 text-left text-slatePro-500">Component</th>
                      <th className="px-2 py-1 text-left text-slatePro-500">Accountable</th>
                      <th className="px-2 py-1 text-left text-slatePro-500">Responsible</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map((a) => (
                      <tr key={a.id} className="border-b border-slatePro-800">
                        <td className="px-2 py-1 text-slatePro-300">{a.cosaiLayer.replace(/_/g, " ")}</td>
                        <td className="px-2 py-1 text-slatePro-300">{a.componentName}</td>
                        <td className="px-2 py-1 text-slatePro-300">{a.accountableParty}</td>
                        <td className="px-2 py-1 text-slatePro-300">{a.responsibleParty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
