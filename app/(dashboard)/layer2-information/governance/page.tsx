/**
 * Data Governance Policies – policy cards, add form, coverage metric.
 */
import { FileText, Shield } from "lucide-react";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { EmptyState } from "@/components/EmptyState";
import { AddPolicyForm } from "./AddPolicyForm";
import { GovernancePolicyCard } from "./GovernancePolicyCard";

const POLICY_TYPE_COLORS: Record<string, string> = {
  CLASSIFICATION: "bg-blue-100 text-blue-700",
  RETENTION: "bg-slate-100 text-slate-700",
  ACCESS: "bg-purple-100 text-purple-700",
  QUALITY: "bg-emerald-100 text-emerald-700",
  PRIVACY: "bg-amber-100 text-amber-700"
};

const CLASSIFICATION_COLORS: Record<string, string> = {
  PUBLIC: "bg-emerald-100 text-emerald-700",
  INTERNAL: "bg-blue-100 text-blue-700",
  CONFIDENTIAL: "bg-amber-100 text-amber-700",
  RESTRICTED: "bg-red-100 text-red-700"
};

export default async function DataGovernancePage() {
  const caller = await createServerCaller();
  const [{ data: policies }, { data: coverage }, { data: users }] = await Promise.all([
    caller.layer2.getGovernancePolicies(),
    caller.layer2.getGovernanceCoverage(),
    caller.assets.getOrgUsers()
  ]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Data Governance Policies
          </h1>
          <p className="mt-1 text-slate-600">
            Classification, retention, access, quality, and privacy policies.
          </p>
        </div>
      </div>

      {/* Policy coverage metric */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700">
          <Shield className="text-navy-600 h-4 w-4" />
          Policy Coverage
        </h3>
        <p className="text-2xl font-bold text-slate-900">
          {coverage.policyCoveragePct}% of CONFIDENTIAL/RESTRICTED entities have an applicable
          approved policy
        </p>
      </div>

      {/* Add Policy form */}
      <AddPolicyForm users={users} />

      {policies.length === 0 ? (
        <EmptyState
          title="No governance policies"
          description="Define data governance policies for classification, retention, access, quality, and privacy."
          ctaLabel="View Layer 2"
          ctaHref="/layer2-information"
          icon={<FileText className="h-8 w-8" />}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {policies.map((p) => (
            <GovernancePolicyCard
              key={p.id}
              policy={p}
              policyTypeColors={POLICY_TYPE_COLORS}
              classificationColors={CLASSIFICATION_COLORS}
            />
          ))}
        </div>
      )}
    </main>
  );
}
