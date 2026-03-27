/**
 * Accountability Matrix report – CoSAI RACI across all assets.
 */
import Link from "next/link";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { SECTION_HEADING_CLASS } from "@/lib/ui/section-heading";

const EXPORT_BTN =
  "rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50";

export default async function AccountabilityMatrixReportPage() {
  const caller = await createServerCaller();
  const { data } = await caller.accountability.getCrossAssetMatrix({});

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-6 px-6 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/reports" className="text-navy-600 text-sm hover:underline">
            ← Reports
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            Accountability Matrix
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Accountable and responsible parties by asset, layer, and component.
          </p>
        </div>
        <button type="button" className={EXPORT_BTN}>
          Export CSV
        </button>
      </div>

      <div className="space-y-4">
        <h2 className={SECTION_HEADING_CLASS}>By asset</h2>
        {data.assets.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-600">
            No assets in scope.
          </div>
        ) : (
          data.assets.map((asset) => {
            const assignments = data.byAsset[asset.id] ?? [];
            return (
              <div
                key={asset.id}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-navy-200"
              >
                <Link
                  href={`/layer3-application/assets/${asset.id}`}
                  className="text-navy-600 font-medium hover:underline"
                >
                  {asset.name}
                </Link>
                <span className="ml-2 font-mono text-xs text-slate-500">{asset.id.slice(0, 8)}…</span>
                <div className="mt-3 overflow-x-auto rounded-lg border border-slate-100">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="px-3 py-2 text-left text-xs font-medium tracking-wide text-slate-500 uppercase">
                          Layer
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium tracking-wide text-slate-500 uppercase">
                          Component
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium tracking-wide text-slate-500 uppercase">
                          Accountable
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium tracking-wide text-slate-500 uppercase">
                          Responsible
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignments.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-3 py-6 text-center text-slate-500">
                            No assignments
                          </td>
                        </tr>
                      ) : (
                        assignments.map((a) => (
                          <tr key={a.id} className="border-b border-slate-100 last:border-0">
                            <td className="whitespace-nowrap px-3 py-2 text-slate-700">
                              {a.cosaiLayer.replace(/_/g, " ")}
                            </td>
                            <td className="min-w-[8rem] px-3 py-2 text-slate-900">{a.componentName}</td>
                            <td className="min-w-[8rem] px-3 py-2 text-slate-700">{a.accountableParty}</td>
                            <td className="min-w-[8rem] px-3 py-2 text-slate-700">{a.responsibleParty}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
