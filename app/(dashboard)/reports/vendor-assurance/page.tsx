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
          <Link href="/reports" className="text-sm text-navy-400 hover:underline">
            ← Reports
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Vendor Assurance Report</h1>
        </div>
        <div className="flex gap-2">
          <button className="rounded border border-slatePro-600 px-3 py-1 text-sm text-slatePro-300">Export PDF</button>
          <button className="rounded border border-slatePro-600 px-3 py-1 text-sm text-slatePro-300">Export CSV</button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slatePro-700">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slatePro-700 bg-slatePro-900/50">
              <th className="px-4 py-2 text-left font-medium text-slatePro-300">Vendor</th>
              <th className="px-4 py-2 text-left font-medium text-slatePro-300">Score</th>
              <th className="px-4 py-2 text-left font-medium text-slatePro-300">Expired Evidence</th>
              <th className="px-4 py-2 text-left font-medium text-slatePro-300">Next Review</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slatePro-500">
                  No vendors
                </td>
              </tr>
            ) : (
              data.map((v) => (
                <tr key={v.id} className="border-b border-slatePro-800">
                  <td className="px-4 py-2">
                    <Link href={`/layer5-supply-chain/vendors/${v.id}`} className="text-navy-400 hover:underline">
                      {v.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-slatePro-200">{Math.round(v.score * 100)}%</td>
                  <td className="px-4 py-2">{v.expiredCount > 0 ? <span className="text-amber-400">{v.expiredCount}</span> : "—"}</td>
                  <td className="px-4 py-2 text-slatePro-400">{v.nextReviewAt?.toLocaleDateString() ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
