/**
 * Gap analysis – gaps per asset grouped by cosaiLayer and framework.
 */
import Link from "next/link";
import { createServerCaller } from "@/lib/trpc/server-caller";
import * as engine from "@/lib/compliance/engine";
import { prisma } from "@/lib/prisma";

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
  const totalGaps = gapReports.reduce((s, r) => s + r.report.criticalGaps.length, 0);

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Gap Analysis</h1>
        <p className="mt-1 text-slatePro-300">
          Compliance gaps per asset, grouped by CoSAI layer and framework.
        </p>
      </div>

      <div className="flex gap-4 rounded-lg border border-slatePro-700 bg-slatePro-900/30 px-4 py-3">
        <div className="text-sm font-medium text-slatePro-400">
          Total critical gaps: <span className="text-slatePro-100">{totalGaps}</span>
        </div>
        <div className="border-l border-slatePro-700 pl-4 text-sm text-slatePro-400">
          Assets with gaps: {withGaps.length}
        </div>
      </div>

      <div className="space-y-6">
        {gapReports.map(({ asset, report }) => (
          <div key={asset.id} className="rounded-lg border border-slatePro-700 bg-slatePro-900/30 p-4">
            <h2 className="mb-2 font-medium text-slatePro-200">
              <Link href={`/layer3-application/assets/${asset.id}`} className="text-navy-400 hover:underline">
                {asset.name}
              </Link>
            </h2>

            {report.criticalGaps.length === 0 ? (
              <p className="text-sm text-emerald-400">No critical gaps</p>
            ) : (
              <>
                <div className="mb-2 text-sm text-slatePro-400">By framework</div>
                <div className="space-y-2">
                  {Object.entries(report.byFramework).map(([code, v]) => {
                    if (v.gaps.length === 0) return null;
                    return (
                      <div key={code} className="rounded border border-slatePro-700 p-2">
                        <div className="text-xs font-medium text-slatePro-500">{code}</div>
                        <ul className="mt-1 space-y-1">
                          {v.gaps.map((g) => (
                            <li key={g.controlId} className="text-sm text-amber-400">
                              {g.controlId}: {g.title} ({g.cosaiLayer ?? "—"})
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 text-sm text-slatePro-400">Recommendations</div>
                <ul className="mt-1 space-y-1 text-sm text-slatePro-300">
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
