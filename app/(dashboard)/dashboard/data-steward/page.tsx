/**
 * Data Governance Summary – for DATA_OWNER.
 */
import Link from "next/link";
import { Database, Shield, GitBranch } from "lucide-react";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { PersonaDashboardShell } from "@/components/dashboard/PersonaDashboardShell";

export default async function DataStewardDashboardPage() {
  const caller = await createServerCaller();

  let masterDataCount = 0;
  let lineageCount = 0;
  try {
    const [mdRes, linRes] = await Promise.all([
      caller.layer2.getMasterDataEntities().catch(() => ({ data: [] })),
      caller.layer2.getLineageRecords().catch(() => ({ data: [] }))
    ]);
    masterDataCount = Array.isArray(mdRes?.data) ? mdRes.data.length : 0;
    lineageCount = Array.isArray(linRes?.data) ? linRes.data.length : 0;
  } catch {
    // Modules may not be enabled
  }

  const restrictedFeedingAI = 0; // Placeholder
  const piiToExternal = 0; // Placeholder
  const ungovernedPipelines = 0; // Placeholder
  const withoutSteward = Math.max(0, masterDataCount - 1);
  const policiesExpiring = 0; // Placeholder

  return (
    <PersonaDashboardShell
      title="Data Governance Summary"
      subtitle="Data exposure, lineage, and governance gaps."
    >
      <div className="flex flex-col gap-6">
        {/* Section 1 – Data exposure */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-medium text-slate-700">Data exposure</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div
              className={`flex items-center gap-2 rounded-lg border p-4 ${
                restrictedFeedingAI > 0
                  ? "border-red-200 bg-red-50"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <Shield className="h-5 w-5 text-slate-600" />
              <div>
                <p className="text-2xl font-bold text-slate-900">{restrictedFeedingAI}</p>
                <p className="text-xs text-slate-600">RESTRICTED entities feeding AI</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <Database className="h-5 w-5 text-slate-600" />
              <div>
                <p className="text-2xl font-bold text-slate-900">{piiToExternal}</p>
                <p className="text-xs text-slate-600">PII flowing to external models</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <GitBranch className="h-5 w-5 text-slate-600" />
              <div>
                <p className="text-2xl font-bold text-slate-900">{ungovernedPipelines}</p>
                <p className="text-xs text-slate-600">Ungoverned data pipelines</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2 – Lineage summary */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-medium text-slate-700">Lineage summary</h3>
          <p className="text-sm text-slate-600">
            {lineageCount} entities in lineage. Top entities mapped to CoSAI layers.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">
              Classification: Internal
            </span>
            <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">
              Restricted: 0
            </span>
            <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">Public: 0</span>
          </div>
        </div>

        {/* Section 3 – Governance gaps */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-medium text-slate-700">Governance gaps</h3>
          <ul className="space-y-2">
            <li className="flex items-center justify-between rounded border border-slate-200 bg-slate-50 px-3 py-2">
              <span className="text-sm text-slate-700">Entities without data steward assigned</span>
              <span className="font-medium text-slate-900">{withoutSteward}</span>
            </li>
            <li className="flex items-center justify-between rounded border border-slate-200 bg-slate-50 px-3 py-2">
              <span className="text-sm text-slate-700">Policies expiring in 30 days</span>
              <span className="font-medium text-slate-900">{policiesExpiring}</span>
            </li>
          </ul>
          <div className="mt-4 flex gap-3">
            <Link
              href="/layer2-information/lineage"
              className="text-navy-600 text-sm font-medium hover:underline"
            >
              View full lineage →
            </Link>
            <Link
              href="/layer2-information/master-data"
              className="text-navy-600 text-sm font-medium hover:underline"
            >
              Manage data →
            </Link>
          </div>
        </div>
      </div>
    </PersonaDashboardShell>
  );
}
