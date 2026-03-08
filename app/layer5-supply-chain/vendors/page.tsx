/**
 * Vendor list – assurance score, evidence expiry calendar, contract alignment gap count.
 */
import Link from "next/link";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { VendorAssuranceScore } from "@/components/supply-chain/VendorAssuranceScore";

export default async function VendorsPage() {
  const caller = await createServerCaller();
  const { data } = await caller.supplyChain.getVendors();

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Vendor Registry</h1>
        <p className="mt-1 text-slatePro-300">
          Vendor assurance scores, evidence expiry, and contract alignment.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slatePro-700">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slatePro-700 bg-slatePro-900/50">
              <th className="px-4 py-2 text-left font-medium text-slatePro-300">Vendor</th>
              <th className="px-4 py-2 text-left font-medium text-slatePro-300">Type</th>
              <th className="px-4 py-2 text-left font-medium text-slatePro-300">Assurance</th>
              <th className="px-4 py-2 text-left font-medium text-slatePro-300">Expired Evidence</th>
              <th className="px-4 py-2 text-left font-medium text-slatePro-300">Contract</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slatePro-400">
                  No vendors registered.
                </td>
              </tr>
            ) : (
              data.map((v) => (
                <tr key={v.id} className="border-b border-slatePro-800 last:border-0">
                  <td className="px-4 py-2">
                    <Link
                      href={`/layer5-supply-chain/vendors/${v.id}`}
                      className="font-medium text-navy-400 hover:underline"
                    >
                      {v.vendorName}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-slatePro-200">{v.vendorType ?? "—"}</td>
                  <td className="px-4 py-2">
                    <VendorAssuranceScore total={v.assuranceScore.total} breakdown={v.assuranceScore.breakdown} />
                  </td>
                  <td className="px-4 py-2">
                    {v.expiredEvidence.length > 0 ? (
                      <span className="text-amber-400">{v.expiredEvidence.length} expired</span>
                    ) : (
                      <span className="text-slatePro-500">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {v.contractAligned ? (
                      <span className="text-emerald-400">Aligned</span>
                    ) : (
                      <span className="text-amber-400">Gap</span>
                    )}
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
