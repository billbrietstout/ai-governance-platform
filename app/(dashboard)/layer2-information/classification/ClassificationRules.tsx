import Link from "next/link";
import { FileText } from "lucide-react";

type Policy = {
  id: string;
  name: string;
  appliesTo: string[];
  status: string;
};

type Props = {
  policies: Policy[];
};

export function ClassificationRules({ policies }: Props) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
        <FileText className="text-navy-600 h-5 w-5" />
        Classification Rules
      </h2>
      <p className="mb-4 text-sm text-slate-600">
        Active policies that govern each classification tier
      </p>
      {policies.length === 0 ? (
        <p className="text-sm text-slate-500">
          No approved classification policies.{" "}
          <Link href="/layer2-information/governance" className="text-navy-600 hover:underline">
            Add a policy →
          </Link>
        </p>
      ) : (
        <ul className="space-y-2">
          {policies.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded border border-slate-200 bg-slate-50 px-3 py-2"
            >
              <span className="font-medium text-slate-900">{p.name}</span>
              <span className="text-xs text-slate-500">Applies to: {p.appliesTo.join(", ")}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
