/**
 * AI Development Checklist – for DEV_LEAD.
 */
import Link from "next/link";
import { Bot, CheckCircle, AlertTriangle } from "lucide-react";
import { auth } from "@/auth";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { PersonaDashboardShell } from "@/components/dashboard/PersonaDashboardShell";
import { complianceBarBgClass, complianceTextClass } from "@/lib/ui/compliance-score";
import { SECTION_HEADING_CLASS } from "@/lib/ui/section-heading";

export default async function DeveloperDashboardPage() {
  const session = await auth();
  const user = session?.user as { id?: string } | undefined;
  const userId = user?.id;
  const caller = await createServerCaller();

  const [assetsRes, gapsRes] = await Promise.all([
    caller.assets.list({}),
    caller.dashboard.getTopGaps({ limit: 20 })
  ]);

  const allAssets = assetsRes.data;
  const myAssets = userId
    ? allAssets.filter((a) => (a as { ownerId?: string }).ownerId === userId)
    : allAssets.slice(0, 5);

  const gapsByAsset = new Map<string, number>();
  for (const g of gapsRes.data) {
    gapsByAsset.set(g.assetId, (gapsByAsset.get(g.assetId) ?? 0) + 1);
  }

  const agenticWithMissingOverride = 0; // Placeholder
  const humanTierCoverage = "—"; // Placeholder

  return (
    <PersonaDashboardShell
      title="AI Development Checklist"
      subtitle="Your assets, deployment readiness, and agentic systems."
    >
      <div className="flex flex-col gap-6">
        {/* Section 1 – My assets */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className={SECTION_HEADING_CLASS}>My assets</h3>
          {myAssets.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center">
              <p className="text-sm text-slate-600">No assets assigned to you yet.</p>
              <Link
                href="/layer3-application/assets"
                className="text-navy-600 mt-3 inline-block text-sm font-medium hover:underline"
              >
                Browse AI assets →
              </Link>
            </div>
          ) : (
            <ul className="space-y-2">
              {myAssets.map((a) => {
                const missingCount = gapsByAsset.get(a.id) ?? 0;
                const assetType = (a as { assetType?: string }).assetType ?? "—";
                return (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-4 rounded border border-slate-200 bg-slate-50 px-3 py-2"
                  >
                    <div className="min-w-0 flex items-center gap-2">
                      <Bot className="h-4 w-4 shrink-0 text-slate-500" />
                      <div className="min-w-0">
                        <Link
                          href={`/layer3-application/assets/${a.id}`}
                          className="text-navy-600 block truncate font-medium hover:underline"
                        >
                          {a.name}
                        </Link>
                        <span className="text-xs text-slate-500">
                          {assetType} · {a.id.slice(0, 8)}…
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span
                        className={`rounded px-2 py-0.5 text-xs ${
                          a.euRiskLevel === "HIGH"
                            ? "bg-red-100 text-red-700"
                            : a.euRiskLevel === "LIMITED"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {a.euRiskLevel ?? "—"}
                      </span>
                      <span className="text-slate-600">
                        {missingCount} missing control{missingCount !== 1 ? "s" : ""}
                      </span>
                      <span className="text-slate-500">Last reviewed: —</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Section 2 – Deployment readiness */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className={SECTION_HEADING_CLASS}>Deployment readiness</h3>
          <p className="mb-4 text-sm text-slate-600">Required controls vs implemented per asset</p>
          {myAssets.length === 0 ? (
            <p className="text-sm text-slate-500">No assets to assess</p>
          ) : (
            <div className="space-y-3">
              {myAssets.slice(0, 5).map((a) => {
                const missing = gapsByAsset.get(a.id) ?? 0;
                const total = 5;
                const pct = Math.round(((total - missing) / total) * 100);
                return (
                  <div key={a.id} className="flex min-w-0 items-center gap-4">
                    <span className="w-40 shrink-0 truncate text-sm text-slate-700">{a.name}</span>
                    <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className={`h-full rounded-full ${complianceBarBgClass(pct)}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className={`w-12 shrink-0 text-right text-sm font-medium ${complianceTextClass(pct)}`}>
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          <p className="mt-4 text-sm text-slate-600">
            What&apos;s blocking deployment: Address missing controls above.
          </p>
        </div>

        {/* Section 3 – Agentic systems */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className={SECTION_HEADING_CLASS}>Agentic systems</h3>
          <div className="space-y-2">
            <p className="text-sm text-slate-600">
              L3+ agents with missing override mechanisms: {agenticWithMissingOverride}
            </p>
            <p className="text-sm text-slate-600">
              Human intervention tier coverage: {humanTierCoverage}
            </p>
          </div>
          <Link
            href="/layer3-application/agents"
            className="text-navy-600 mt-4 inline-block text-sm font-medium hover:underline"
          >
            View agentic registry →
          </Link>
        </div>
      </div>
    </PersonaDashboardShell>
  );
}
