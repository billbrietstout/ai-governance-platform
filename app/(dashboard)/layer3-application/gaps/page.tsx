/**
 * Gap Analysis – gaps grouped by framework with severity badges.
 */
import Link from "next/link";
import { createServerCaller } from "@/lib/trpc/server-caller";
import * as engine from "@/lib/compliance/engine";
import { prisma } from "@/lib/prisma";

const FRAMEWORK_COLORS: Record<string, string> = {
  NIST_AI_RMF: "bg-blue-100 text-blue-700 border-blue-200",
  EU_AI_ACT: "bg-amber-100 text-amber-700 border-amber-200",
  COSAI_SRF: "bg-purple-100 text-purple-700 border-purple-200",
  NIST_CSF: "bg-emerald-100 text-emerald-700 border-emerald-200",
  ISO_42001: "bg-gray-100 text-gray-700 border-gray-200"
};

export default async function GapsPage() {
  const caller = await createServerCaller();
  const { data: assets } = await caller.assets.list({});

  const gapReports = await Promise.all(
    assets.map(async (a) => {
      const report = await engine.getGapAnalysis(prisma, a.id);
      return { asset: a, report };
    })
  );

  const withGaps = gapReports.filter((r) => r.report.criticalGaps.length > 0);
  const allGaps = withGaps.flatMap((r) =>
    r.report.criticalGaps.map((g) => ({
      ...g,
      assetId: r.asset.id,
      assetName: r.asset.name
    }))
  );

  const bySeverity = {
    critical: allGaps.filter((g) => g.status === "NON_COMPLIANT" || g.status === "PENDING").length,
    high: 0,
    medium: 0,
    low: 0
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Gap Analysis</h1>
        <p className="mt-1 text-gray-600">
          Compliance gaps per asset, grouped by CoSAI layer and framework.
        </p>
      </div>

      {/* Summary panel */}
      <div className="flex flex-wrap gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
        <span className="flex items-center gap-2">
          <span className="rounded bg-red-100 px-2.5 py-0.5 text-sm font-medium text-red-700">
            {bySeverity.critical} critical
          </span>
        </span>
        <span className="flex items-center gap-2">
          <span className="rounded bg-amber-100 px-2.5 py-0.5 text-sm font-medium text-amber-700">
            {bySeverity.high} high
          </span>
        </span>
        <span className="flex items-center gap-2">
          <span className="rounded bg-yellow-100 px-2.5 py-0.5 text-sm font-medium text-yellow-700">
            {bySeverity.medium} medium
          </span>
        </span>
        <span className="flex items-center gap-2">
          <span className="rounded bg-gray-100 px-2.5 py-0.5 text-sm font-medium text-gray-600">
            {bySeverity.low} low
          </span>
        </span>
        <span className="border-l border-gray-200 pl-4 text-sm text-gray-600">
          {withGaps.length} assets with gaps
        </span>
      </div>

      <div className="space-y-6">
        {gapReports.map(({ asset, report }) => (
          <div key={asset.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 font-medium text-gray-900">
              <Link href={`/layer3-application/assets/${asset.id}`} className="text-navy-600 hover:underline">
                {asset.name}
              </Link>
            </h2>

            {report.criticalGaps.length === 0 ? (
              <p className="text-sm text-emerald-600">No critical gaps</p>
            ) : (
              <>
                <div className="mb-2 text-sm text-gray-600">By framework</div>
                <div className="space-y-3">
                  {Object.entries(report.byFramework).map(([code, v]) => {
                    if (v.gaps.length === 0) return null;
                    const fwColor = FRAMEWORK_COLORS[code] ?? "bg-gray-100 text-gray-700 border-gray-200";
                    return (
                      <div key={code} className="rounded border border-gray-200 bg-gray-50 p-3">
                        <span className={`inline-block rounded border px-2 py-0.5 text-xs font-medium ${fwColor}`}>
                          {code.replace(/_/g, " ")}
                        </span>
                        <ul className="mt-2 space-y-2">
                          {v.gaps.map((g) => (
                            <li
                              key={g.controlId}
                              className="flex items-center justify-between gap-4 rounded border border-gray-200 bg-white px-3 py-2"
                            >
                              <div>
                                <span className="font-medium text-gray-900">{g.controlId}</span>
                                <span className="ml-2 text-gray-500">— {g.title}</span>
                                <span className="ml-2 text-xs text-gray-500">({g.cosaiLayer ?? "—"})</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-700">
                                  Critical
                                </span>
                                <Link
                                  href={`/layer3-application/assets/${asset.id}`}
                                  className="text-xs text-navy-600 hover:underline"
                                >
                                  View →
                                </Link>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 text-sm text-gray-600">Recommendations</div>
                <ul className="mt-1 space-y-1 text-sm text-gray-700">
                  {report.recommendations.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
