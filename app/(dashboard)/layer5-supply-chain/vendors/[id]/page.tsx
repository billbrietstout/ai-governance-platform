/**
 * Vendor detail – full profile, evidence library, contract checklist.
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { VendorAssuranceScore } from "@/components/supply-chain/VendorAssuranceScore";

export default async function VendorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const caller = await createServerCaller();
  const { data } = await caller.supplyChain.getVendor({ id });

  if (!data) notFound();
  const v = data;

  return (
    <main className="mx-auto flex min-h-dvh max-w-4xl flex-col gap-6 px-6 py-10">
      <div>
        <Link href="/layer5-supply-chain/vendors" className="text-navy-600 text-sm hover:underline">
          ← Vendor Registry
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">{v.vendorName}</h1>
        <div className="mt-2 flex items-center gap-4">
          <VendorAssuranceScore
            total={v.assuranceScore.total}
            breakdown={v.assuranceScore.breakdown}
          />
          <span className="text-sm text-gray-600">{v.vendorType ?? "—"}</span>
        </div>
      </div>

      <section>
        <h2 className="mb-2 text-lg font-medium text-gray-900">Assurance Breakdown</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {Object.entries(v.assuranceScore.breakdown).map(([key, val]) => (
            <div
              key={key}
              className="flex justify-between rounded border border-gray-200 bg-white px-3 py-2 shadow-sm"
            >
              <span className="text-gray-600">{key.replace(/([A-Z])/g, " $1").trim()}</span>
              <span className="font-medium text-gray-900">{Math.round(val * 100)}%</span>
            </div>
          ))}
        </div>
      </section>

      {v.expiredEvidence.length > 0 && (
        <section>
          <h2 className="mb-2 text-lg font-medium text-amber-700">Expired Evidence</h2>
          <ul className="space-y-1 rounded-lg border border-amber-200 bg-amber-50 p-3">
            {v.expiredEvidence.map((e, i) => (
              <li key={i} className="text-sm text-gray-900">
                <span className="font-medium">{e.type}</span>: {e.message}
                {e.expiredAt && (
                  <span className="ml-1 text-gray-500">({e.expiredAt.toLocaleDateString()})</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-lg font-medium text-gray-900">Evidence & Certifications</h2>
        <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <Row label="SOC2" value={v.soc2Status ?? "—"} />
          <Row label="SOC2 Expires" value={v.soc2ExpiresAt?.toLocaleDateString() ?? "—"} />
          <Row label="ISO 27001" value={v.iso27001Status ?? "—"} />
          <Row label="SLSA Level" value={v.slsaLevel ?? "—"} />
          <Row label="Model Cards" value={v.modelCardAvailable ? "Yes" : "No"} />
          <Row label="Contract Aligned" value={v.contractAligned ? "Yes" : "No"} />
          <Row label="Last Reviewed" value={v.lastReviewedAt?.toLocaleDateString() ?? "—"} />
          <Row label="Next Review" value={v.nextReviewAt?.toLocaleDateString() ?? "—"} />
        </div>
      </section>

      {v.evidenceLinks && typeof v.evidenceLinks === "object" && Array.isArray(v.evidenceLinks) && (
        <section>
          <h2 className="mb-2 text-lg font-medium text-gray-900">Evidence Links</h2>
          <ul className="space-y-1">
            {(v.evidenceLinks as string[]).map((link, i) => (
              <li key={i}>
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-navy-400 hover:underline"
                >
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-lg font-medium text-gray-900">Contract Checklist</h2>
        <p className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600 shadow-sm">
          Contract alignment checklist coming soon.
        </p>
      </section>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-600">{label}</span>
      <span className="text-gray-900">{value}</span>
    </div>
  );
}
