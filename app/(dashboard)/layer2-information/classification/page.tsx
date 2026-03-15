/**
 * Data Classification – tier cards, matrix, rules, AI Access Cascade.
 */
import { Shield, ArrowRight, FileText } from "lucide-react";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { ClassificationTierCards } from "./ClassificationTierCards";
import { ClassificationMatrix } from "./ClassificationMatrix";
import { ClassificationRules } from "./ClassificationRules";
import { AiAccessCascade } from "./AiAccessCascade";

const AI_ACCESS_COLORS: Record<string, string> = {
  OPEN: "bg-emerald-100 text-emerald-700",
  GOVERNED: "bg-blue-100 text-blue-700",
  RESTRICTED: "bg-amber-100 text-amber-700",
  PROHIBITED: "bg-red-100 text-red-700"
};

export default async function ClassificationPage() {
  const caller = await createServerCaller();
  const [{ data: matrixData }, { data: policies }] = await Promise.all([
    caller.layer2.getClassificationMatrix(),
    caller.layer2.getGovernancePolicies()
  ]);

  const applicablePolicies = policies.filter(
    (p) => p.policyType === "CLASSIFICATION" && p.status === "APPROVED"
  );

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Data Classification</h1>
        <p className="mt-1 text-slate-600">
          Classification tiers, access matrix, and AI system mapping.
        </p>
      </div>

      {/* Classification tier cards */}
      <ClassificationTierCards />

      {/* Classification matrix table */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Classification Matrix</h2>
        <p className="mb-4 text-sm text-slate-600">
          Entity type × AI system type → allowed access policy
        </p>
        <ClassificationMatrix data={matrixData} colors={AI_ACCESS_COLORS} />
      </div>

      {/* Classification Rules */}
      <ClassificationRules policies={applicablePolicies} />

      {/* AI Access Cascade */}
      <AiAccessCascade />
    </main>
  );
}
