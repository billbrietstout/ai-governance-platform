/**
 * Vendor Assurance report – posture and expiry status.
 */
import Link from "next/link";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { complianceTextClass } from "@/lib/ui/compliance-score";
import { SECTION_HEADING_CLASS } from "@/lib/ui/section-heading";

const EXPORT_BTN =
  "rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50";

export default async function VendorAssuranceReportPage() {
  const caller = await createServerCaller();
  const { data } = await caller.dashboard.getVendorAssuranceSummary();

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-6 px-6 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/reports" className="text-navy-600 text-sm hover:underline">
            ← Reports
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            Vendor Assurance Report
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Assurance posture, evidence expiry, and next review dates by vendor.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button type="button" className={EXPORT_BTN}>
            Export PDF
          </button>
          <button type="button" className={EXPORT_BTN}>
            Export CSV
          </button>
        </div>
      </div>

      <div>
        <h2 className={SECTION_HEADING_CLASS}>Vendors</h2>
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wide text-slate-500 uppercase">
                  Vendor
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wide text-slate-500 uppercase">
                  Score
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wide text-slate-500 uppercase">
                  Expired Evidence
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wide text-slate-500 uppercase">
                  Next Review
                </th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                    No vendors
                  </td>
                </tr>
              ) : (
                data.map((v) => {
                  const pct = Math.round(v.score * 100);
                  return (
                    <tr key={v.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <Link
                          href={`/layer5-supply-chain/vendors/${v.id}`}
                          className="text-navy-600 font-medium hover:underline"
                        >
                          {v.name}
                        </Link>
                      </td>
                      <td className={`px-4 py-3 font-semibold tabular-nums ${complianceTextClass(pct)}`}>
                        {pct}%
                      </td>
                      <td className="px-4 py-3">
                        {v.expiredCount > 0 ? (
                          <span className="font-medium text-amber-700">{v.expiredCount}</span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                        {v.nextReviewAt?.toLocaleDateString() ?? "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
