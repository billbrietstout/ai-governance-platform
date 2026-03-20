/**
 * Supply Chain & Vendor Overview – for VENDOR_MGR.
 */
import Link from "next/link";
import { Building, Package, Shield } from "lucide-react";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { PersonaDashboardShell } from "@/components/dashboard/PersonaDashboardShell";

export default async function SupplyChainDashboardPage() {
  const caller = await createServerCaller();

  const [vendorRes, kpisRes] = await Promise.all([
    caller.dashboard.getVendorAssuranceSummary(),
    caller.dashboard.getKPIs()
  ]);

  const vendors = vendorRes.data;
  const kpis = kpisRes.data;
  const expiredCount = vendors.filter((v) => v.expiredCount > 0).length;

  return (
    <PersonaDashboardShell
      title="Supply Chain & Vendor Overview"
      subtitle="Vendors, artifact cards, and assurance status."
    >
      <div className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <Building className="text-navy-600 h-5 w-5" />
            <p className="mt-2 text-2xl font-bold text-slate-900">{vendors.length}</p>
            <p className="text-xs text-slate-500">Total vendors</p>
          </div>
          <Link
            href="/layer5-supply-chain/vendors"
            className="hover:border-navy-300 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition"
          >
            <Shield className="h-5 w-5 text-amber-600" />
            <p className="mt-2 text-2xl font-bold text-slate-900">{expiredCount}</p>
            <p className="text-xs text-slate-500">With expired evidence</p>
          </Link>
          <Link
            href="/layer5-supply-chain/cards"
            className="hover:border-navy-300 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition"
          >
            <Package className="text-navy-600 h-5 w-5" />
            <p className="mt-2 text-2xl font-bold text-slate-900">{kpis.staleCards ?? 0}</p>
            <p className="text-xs text-slate-500">Stale cards (&gt;30d)</p>
          </Link>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-medium text-slate-700">Vendor assurance</h3>
          {vendors.length === 0 ? (
            <p className="text-sm text-slate-500">No vendors on record</p>
          ) : (
            <ul className="space-y-2">
              {vendors.slice(0, 5).map((v) => (
                <li
                  key={v.id}
                  className="flex items-center justify-between rounded border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <Link
                    href={`/layer5-supply-chain/vendors/${v.id}`}
                    className="text-navy-600 font-medium hover:underline"
                  >
                    {v.name}
                  </Link>
                  <span className={v.expiredCount > 0 ? "text-amber-600" : "text-emerald-600"}>
                    {Math.round((v.score ?? 0) * 100)}%{v.expiredCount > 0 && " ⚠"}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/layer5-supply-chain/vendors"
            className="text-navy-600 mt-4 inline-block text-sm font-medium hover:underline"
          >
            View all vendors →
          </Link>
        </div>
      </div>
    </PersonaDashboardShell>
  );
}
