/**
 * Vendor Assurance report – posture and expiry status.
 */
import Link from "next/link";
import { createServerCaller } from "@/lib/trpc/server-caller";

export default async function VendorAssuranceReportPage() {
  const caller = await createServerCaller();
  const { data } = await caller.dashboard.getVendorAssuranceSummary();

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/reports" className="text-navy-400 text-sm hover:underline">
            ← Reports
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Vendor Assurance Report</h1>
        </div>
        <div className="flex gap-2">
          <button className="border-slatePro-600 text-slatePro-300 rounded border px-3 py-1 text-sm">
            Export PDF
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
              <th className="text-slatePro-300 px-4 py-2 text-left font-medium">Vendor</th>
              <th className="text-slatePro-300 px-4 py-2 text-left font-medium">Score</th>
              <th className="text-slatePro-300 px-4 py-2 text-left font-medium">
                Expired Evidence
              </th>
              <th className="text-slatePro-300 px-4 py-2 text-left font-medium">Next Review</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-slatePro-500 px-4 py-8 text-center">
                  No vendors
                </td>
              </tr>
            ) : (
              data.map((v) => (
                <tr key={v.id} className="border-slatePro-800 border-b">
                  <td className="px-4 py-2">
                    <Link
                      href={`/layer5-supply-chain/vendors/${v.id}`}
                      className="text-navy-400 hover:underline"
                    >
                      {v.name}
                    </Link>
                  </td>
                  <td className="text-slatePro-200 px-4 py-2">{Math.round(v.score * 100)}%</td>
                  <td className="px-4 py-2">
                    {v.expiredCount > 0 ? (
                      <span className="text-amber-400">{v.expiredCount}</span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="text-slatePro-400 px-4 py-2">
                    {v.nextReviewAt?.toLocaleDateString() ?? "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
