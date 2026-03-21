/**
 * Prompt Governance – Layer 2: Information.
 */
import Link from "next/link";
import { FileText, Shield, AlertTriangle, CheckCircle } from "lucide-react";
import { createServerCaller } from "@/lib/trpc/server-caller";

const POLICIES = [
  { name: "No PII in System Prompts", status: "ACTIVE", scope: "ALL assets" },
  {
    name: "Employment Decision Prompts Require Legal Review",
    status: "ACTIVE",
    scope: "HIGH risk HR assets"
  },
  {
    name: "Agent Planning Prompts Require Security Review",
    status: "ACTIVE",
    scope: "AGENT type assets"
  }
];

const VIOLATIONS = [
  {
    asset: "CV Screening Assistant",
    issue: "System prompt contains candidate name references",
    status: "OPEN",
    daysAgo: 3
  },
  {
    asset: "Dynamic Pricing Model",
    issue: "Prompt lacks transparency disclosure",
    status: "OPEN",
    daysAgo: 7
  }
];

const STATUS_BADGES: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  REVIEW: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  DEPRECATED: "bg-gray-100 text-gray-500"
};

const RISK_BADGES: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-700",
  MEDIUM: "bg-amber-100 text-amber-700",
  HIGH: "bg-red-100 text-red-700"
};

export default async function PromptGovernancePage() {
  const caller = await createServerCaller();
  const res = await caller.layer2.getPromptTemplates();
  const { templates, summary } = res.data;

  return (
    <main className="flex flex-col gap-6">
      <div>
        <Link href="/layer2-information" className="text-navy-400 text-sm hover:underline">
          ← Layer 2: Information
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Prompt Governance</h1>
        <p className="mt-1 text-gray-600">
          Registry of prompt templates and governance policies.
        </p>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <FileText className="text-navy-500 h-4 w-4" />
            <span className="text-sm font-medium text-slate-600">Total Prompts</span>
          </div>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{summary.total}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-medium text-slate-600">Approved</span>
          </div>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{summary.approvedPct}%</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-medium text-slate-600">Pending Review</span>
          </div>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{summary.pendingReview}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-slate-600">Policy Violations (30d)</span>
          </div>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{summary.policyViolations30d}</p>
        </div>
      </div>

      {/* Prompt Template Registry */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-medium text-slate-700">Prompt Template Registry</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Template</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Asset</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Risk</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Owner</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  Last Reviewed
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((t) => (
                <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">{t.templateName}</span>
                    {t.riskFlag && <p className="mt-0.5 text-xs text-amber-600">{t.riskFlag}</p>}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{t.assetName}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{t.type}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGES[t.status] ?? STATUS_BADGES.DRAFT}`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${RISK_BADGES[t.riskLevel] ?? RISK_BADGES.LOW}`}
                    >
                      {t.riskLevel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{t.ownerEmail}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {t.lastReviewed ? new Date(t.lastReviewed).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/layer3-application/assets/${t.assetId}`}
                      className="text-navy-600 text-sm font-medium hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Prompt Policy Panel */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-medium text-slate-700">Prompt Policy Panel</h2>
          <ul className="space-y-2">
            {POLICIES.map((p) => (
              <li
                key={p.name}
                className="flex items-center justify-between rounded border border-slate-200 bg-slate-50 px-3 py-2"
              >
                <div>
                  <span className="font-medium text-gray-900">{p.name}</span>
                  <p className="text-xs text-slate-500">Applies to: {p.scope}</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  {p.status}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Recent Policy Violations */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-medium text-slate-700">Recent Policy Violations</h2>
          <ul className="space-y-2">
            {VIOLATIONS.map((v) => (
              <li
                key={`${v.asset}-${v.issue}`}
                className="flex items-center justify-between rounded border border-red-100 bg-red-50/50 px-3 py-2"
              >
                <div>
                  <span className="font-medium text-gray-900">{v.asset}</span>
                  <p className="text-xs text-slate-600">{v.issue}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{v.daysAgo} days ago</p>
                </div>
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                  {v.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
