/**
 * Vertical Regulation Detail – drill-down for a client vertical.
 */
import Link from "next/link";
import { auth } from "@/auth";
import { createServerCaller } from "@/lib/trpc/server-caller";
import {
  VERTICAL_REGULATIONS,
  assetAppliesToRegulation,
  type VerticalKey
} from "@/lib/vertical-regulations";
import { prisma } from "@/lib/prisma";
import { ComplianceRing } from "@/components/assets/ComplianceRing";
import { notFound } from "next/navigation";

const REGULATORY_CALENDAR = [
  { regulation: "EU AI Act", deadline: "Aug 2026", note: "High-risk systems compliance deadline" },
  { regulation: "NYC Local Law 144", deadline: "Annual", note: "Annual bias audit required" },
  { regulation: "DORA", deadline: "Annual", note: "ICT risk assessment annual review" }
];

export default async function VerticalDetailPage({
  params
}: {
  params: Promise<{ vertical: string }>;
}) {
  const session = await auth();
  const orgId = (session?.user as { orgId?: string })?.orgId;
  if (!orgId) notFound();

  const { vertical: verticalSlug } = await params;
  const verticalKey = verticalSlug.toUpperCase().replace(/-/g, "_") as VerticalKey;

  const profile = VERTICAL_REGULATIONS[verticalKey];
  if (!profile) notFound();

  const caller = await createServerCaller();
  const portfolioRes = await caller.executiveDashboard.getVerticalPortfolio();
  const verticalData = portfolioRes.data.verticals.find((v) => v.verticalKey === verticalKey);

  const assetsFiltered = await prisma.aIAsset.findMany({
    where: { orgId, deletedAt: null, assetType: { not: "DATASET" } },
    select: {
      id: true,
      name: true,
      assetType: true,
      description: true,
      clientVertical: true
    }
  });

  const attestations = await prisma.controlAttestation.groupBy({
    by: ["assetId"],
    where: {
      assetId: { in: assetsFiltered.map((a) => a.id) },
      status: "COMPLIANT"
    },
    _count: true
  });
  const assetHasCompliant = new Map(attestations.map((a) => [a.assetId, a._count > 0]));

  return (
    <main className="mx-auto flex min-h-dvh max-w-4xl flex-col gap-6 px-6 py-10">
      <div>
        <Link href="/layer1-business" className="text-sm text-navy-600 hover:underline">
          ← Layer 1: Business
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          {profile.label}
        </h1>
        <p className="mt-1 text-slate-600">{profile.description}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Regulations */}
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-slate-700">Applicable Regulations</h2>
          {profile.regulations.map((reg) => {
            const inScopeAssets = assetsFiltered.filter(
              (a) =>
                (a.clientVertical === verticalKey || a.clientVertical == null) &&
                assetAppliesToRegulation(a, reg)
            );
            const compliantCount = inScopeAssets.filter((a) => assetHasCompliant.get(a.id)).length;
            const gapCount = inScopeAssets.length - compliantCount;

            return (
              <div
                key={reg.code}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-slate-900">{reg.name}</h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {reg.code} · {reg.jurisdiction}
                    </p>
                    {reg.description && (
                      <p className="mt-2 text-sm text-slate-600">{reg.description}</p>
                    )}
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      gapCount === 0 && inScopeAssets.length > 0
                        ? "bg-emerald-100 text-emerald-700"
                        : gapCount > 0
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {inScopeAssets.length === 0
                      ? "NOT_APPLICABLE"
                      : gapCount === 0
                        ? "COMPLIANT"
                        : "GAP"}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-600">
                  {inScopeAssets.length} asset(s) in scope · {gapCount} gap(s)
                </p>
                <ul className="mt-2 space-y-1">
                  {inScopeAssets.slice(0, 5).map((a) => (
                    <li key={a.id} className="flex items-center justify-between text-sm">
                      <Link
                        href={`/layer3-application/assets/${a.id}`}
                        className="text-navy-600 hover:underline"
                      >
                        {a.name}
                      </Link>
                      <span
                        className={
                          assetHasCompliant.get(a.id)
                            ? "text-emerald-600"
                            : "text-amber-600"
                        }
                      >
                        {assetHasCompliant.get(a.id) ? "Compliant" : "Gap"}
                      </span>
                    </li>
                  ))}
                  {inScopeAssets.length > 5 && (
                    <li className="text-xs text-slate-500">
                      +{inScopeAssets.length - 5} more
                    </li>
                  )}
                </ul>
                <Link
                  href="/layer1-business/regulatory-cascade"
                  className="mt-2 block text-xs text-navy-600 hover:underline"
                >
                  View controls →
                </Link>
              </div>
            );
          })}
        </div>

        {/* Regulatory Calendar */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-medium text-slate-700">Regulatory Calendar</h2>
          <p className="mt-1 text-xs text-slate-500">Upcoming deadlines</p>
          <ul className="mt-3 space-y-2">
            {REGULATORY_CALENDAR.map((item) => (
              <li
                key={item.regulation}
                className="flex items-start justify-between rounded border border-slate-200 bg-slate-50 px-3 py-2"
              >
                <div>
                  <span className="font-medium text-slate-900">{item.regulation}</span>
                  <p className="text-xs text-slate-600">{item.note}</p>
                </div>
                <span className="text-sm font-medium text-slate-700">{item.deadline}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {verticalData && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-medium text-slate-700">Overall Compliance</h2>
          <div className="mt-2 flex items-center gap-4">
            <ComplianceRing percentage={verticalData.complianceScore} size={48} strokeWidth={4} />
            <div>
              <p className="text-sm text-slate-600">
                {verticalData.assetCount} asset(s) in scope for this vertical
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
