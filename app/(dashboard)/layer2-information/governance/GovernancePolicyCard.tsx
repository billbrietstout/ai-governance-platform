import { FileText } from "lucide-react";

type Policy = {
  id: string;
  name: string;
  policyType: string;
  description: string;
  appliesTo: string[];
  controls: string[];
  status: string;
  approvedAt: Date | null;
  owner: { email: string } | null;
};

type Props = {
  policy: Policy;
  policyTypeColors: Record<string, string>;
  classificationColors: Record<string, string>;
};

export function GovernancePolicyCard({ policy, policyTypeColors, classificationColors }: Props) {
  const ownerEmail = policy.owner?.email?.split("@")[0] ?? "—";

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy-100">
          <FileText className="h-5 w-5 text-navy-600" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-slate-900">{policy.name}</h3>
          <span
            className={`mt-1 inline-block rounded px-2 py-0.5 text-xs font-medium ${policyTypeColors[policy.policyType] ?? "bg-gray-100 text-gray-700"}`}
          >
            {policy.policyType}
          </span>
        </div>
        <span
          className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${
            policy.status === "DRAFT" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {policy.status}
        </span>
      </div>

      <p className="mt-3 line-clamp-2 text-sm text-slate-600">{policy.description}</p>

      <div className="mt-3 flex flex-wrap gap-1">
        {policy.appliesTo.map((c) => (
          <span
            key={c}
            className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${classificationColors[c] ?? "bg-gray-100 text-gray-600"}`}
          >
            {c}
          </span>
        ))}
      </div>

      {policy.controls.length > 0 && (
        <p className="mt-2 text-xs text-slate-500">
          Controls: {policy.controls.slice(0, 2).join(", ")}
          {policy.controls.length > 2 && ` +${policy.controls.length - 2}`}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>Owner: {ownerEmail}</span>
        {policy.approvedAt && (
          <span>Approved {new Date(policy.approvedAt).toLocaleDateString()}</span>
        )}
      </div>
    </div>
  );
}
