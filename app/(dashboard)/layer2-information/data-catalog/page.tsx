/**
 * Data Catalog – Layer 2: Information.
 */
import Link from "next/link";
import { Database, FileCheck, ShieldAlert, AlertCircle } from "lucide-react";
import { createServerCaller } from "@/lib/trpc/server-caller";

const CLASSIFICATION_BADGES: Record<string, string> = {
  PUBLIC: "bg-gray-100 text-gray-700",
  INTERNAL: "bg-slate-100 text-slate-700",
  CONFIDENTIAL: "bg-amber-100 text-amber-700",
  RESTRICTED: "bg-red-100 text-red-700"
};

export default async function DataCatalogPage() {
  const caller = await createServerCaller();
  const res = await caller.layer2.getDatasets();
  const { datasets, summary } = res.data;

  const datasetsWithIssues = datasets.filter((d) => d.issues);

  return (
    <main className="flex flex-col gap-6">
      <div>
        <Link href="/layer2-information" className="text-navy-400 text-sm hover:underline">
          ← Layer 2: Information
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Data Catalog</h1>
        <p className="text-slatePro-300 mt-1">AI training and inference data sources.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Database className="text-navy-500 h-4 w-4" />
            <span className="text-sm font-medium text-slate-600">Total Datasets</span>
          </div>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{summary.total}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-medium text-slate-600">With Data Cards</span>
          </div>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{summary.withDataCardsPct}%</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-medium text-slate-600">PII Datasets</span>
          </div>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{summary.piiCount}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-slate-600">Pending Review</span>
          </div>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{summary.pendingReview}</p>
        </div>
      </div>

      {/* Dataset Registry */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-medium text-slate-700">Dataset Registry</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Dataset</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  Classification
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">PII</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  Asset Count
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  Data Steward
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  Last Audited
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  Compliance
                </th>
              </tr>
            </thead>
            <tbody>
              {datasets.map((d) => (
                <tr key={d.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/layer3-application/assets/${d.id}`}
                      className="text-navy-600 font-medium hover:underline"
                    >
                      {d.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{d.type}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${CLASSIFICATION_BADGES[d.classification] ?? CLASSIFICATION_BADGES.INTERNAL}`}
                    >
                      {d.classification}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{d.pii ? "Yes" : "No"}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{d.assetCount}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{d.stewardEmail}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{d.lastAudited ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        d.complianceStatus === "COMPLIANT"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {d.complianceStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Data Issues Panel */}
      {datasetsWithIssues.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-medium text-slate-700">Data Issues Panel</h2>
          <ul className="space-y-2">
            {datasetsWithIssues.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between rounded border border-amber-200 bg-white px-3 py-2"
              >
                <div>
                  <Link
                    href={`/layer3-application/assets/${d.id}`}
                    className="text-navy-600 font-medium hover:underline"
                  >
                    {d.name}
                  </Link>
                  <p className="text-sm text-slate-600">{d.issues}</p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    d.issues?.toLowerCase().includes("consent")
                      ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {d.issues?.toLowerCase().includes("consent") ? "CRITICAL" : "HIGH"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
