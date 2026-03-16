/**
 * Regulatory Compliance Status – for LEGAL.
 */
import Link from "next/link";
import { Scale, FileCheck, Calendar, FileDown } from "lucide-react";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { PersonaDashboardShell } from "@/components/dashboard/PersonaDashboardShell";

const REGULATIONS = [
  { code: "EU_AI_ACT", name: "EU AI Act", jurisdiction: "EU", deadline: "Aug 2026", status: "ON TRACK" as const },
  { code: "ISO_42001", name: "ISO 42001", jurisdiction: "International", deadline: "—", status: "ON TRACK" as const },
  { code: "NIST_AI_RMF", name: "NIST AI RMF", jurisdiction: "US", deadline: "—", status: "AT RISK" as const }
];

export default async function ComplianceOfficerDashboardPage() {
  const caller = await createServerCaller();

  const [cascadeRes, snapshotsRes] = await Promise.all([
    caller.dashboard.getRegulatoryCascadeStatus(),
    caller.audit?.getSnapshots?.().catch(() => ({ data: [] }))
  ]);

  const cascade = cascadeRes.data;
  const snapshots = Array.isArray(snapshotsRes?.data) ? snapshotsRes.data : [];
  const compliancePct = cascade.totalRequirements > 0 ? Math.round((cascade.met / cascade.totalRequirements) * 100) : 0;

  return (
    <PersonaDashboardShell
      title="Regulatory Compliance Status"
      subtitle="Regulation dashboard, evidence status, and upcoming deadlines."
    >
      <div className="flex flex-col gap-6">
        {/* Section 1 – Regulation dashboard */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-medium text-slate-700">Regulation dashboard</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {REGULATIONS.map((r) => (
              <div
                key={r.code}
                className="rounded-lg border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{r.name}</p>
                    <p className="text-xs text-slate-500">{r.jurisdiction}</p>
                    <p className="mt-1 text-xs text-amber-600">
                      Deadline: {r.deadline}
                    </p>
                  </div>
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${
                      r.status === "ON TRACK"
                        ? "bg-emerald-100 text-emerald-700"
                        : r.status === "AT RISK"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-navy-500"
                    style={{
                      width: `${r.status === "ON TRACK" ? 75 : r.status === "AT RISK" ? 45 : 20}%`
                    }}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {r.status === "ON TRACK" ? 75 : r.status === "AT RISK" ? 45 : 20}% compliance
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2 – Evidence status */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-medium text-slate-700">Evidence status</h3>
          <div className="flex items-center gap-4">
            <p className="text-2xl font-bold text-slate-900">
              {cascade.met} / {cascade.totalRequirements} requirements met
            </p>
            <div className="flex-1">
              <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-navy-500"
                  style={{ width: `${compliancePct}%` }}
                />
              </div>
            </div>
            <span className="text-sm font-medium">{compliancePct}%</span>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Missing critical evidence: {cascade.totalRequirements - cascade.met} items
          </p>
          <Link
            href="/audit-package/evidence-workbook"
            className="mt-2 inline-block text-sm font-medium text-navy-600 hover:underline"
          >
            View evidence workbook →
          </Link>
        </div>

        {/* Section 3 – Upcoming deadlines */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-medium text-slate-700">Upcoming deadlines</h3>
          <p className="text-sm text-slate-600">
            EU AI Act: August 2026 • ISO 42001: Certification timeline
          </p>
          <div className="mt-4 flex gap-3">
            <a
              href="/api/v1/export/audit-package"
              className="flex items-center gap-2 rounded bg-navy-600 px-4 py-2 text-sm font-medium text-white hover:bg-navy-500"
            >
              <FileDown className="h-4 w-4" />
              Generate audit package →
            </a>
          </div>
        </div>
      </div>
    </PersonaDashboardShell>
  );
}
