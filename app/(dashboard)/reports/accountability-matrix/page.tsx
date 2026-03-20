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
          <Link href="/reports" className="text-navy-400 text-sm hover:underline">
            ← Reports
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Accountability Matrix</h1>
        </div>
        <div className="flex gap-2">
          <button className="border-slatePro-600 text-slatePro-300 rounded border px-3 py-1 text-sm">
            Export CSV
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {data.assets.map((asset) => {
          const assignments = data.byAsset[asset.id] ?? [];
          return (
            <div
              key={asset.id}
              className="border-slatePro-700 bg-slatePro-900/30 rounded-lg border p-4"
            >
              <Link
                href={`/layer3-application/assets/${asset.id}`}
                className="text-navy-400 font-medium hover:underline"
              >
                {asset.name}
              </Link>
              <div className="mt-2 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-slatePro-700 border-b">
                      <th className="text-slatePro-500 px-2 py-1 text-left">Layer</th>
                      <th className="text-slatePro-500 px-2 py-1 text-left">Component</th>
                      <th className="text-slatePro-500 px-2 py-1 text-left">Accountable</th>
                      <th className="text-slatePro-500 px-2 py-1 text-left">Responsible</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map((a) => (
                      <tr key={a.id} className="border-slatePro-800 border-b">
                        <td className="text-slatePro-300 px-2 py-1">
                          {a.cosaiLayer.replace(/_/g, " ")}
                        </td>
                        <td className="text-slatePro-300 px-2 py-1">{a.componentName}</td>
                        <td className="text-slatePro-300 px-2 py-1">{a.accountableParty}</td>
                        <td className="text-slatePro-300 px-2 py-1">{a.responsibleParty}</td>
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
