import { ArrowRight } from "lucide-react";

const CASCADE = [
  {
    classification: "PUBLIC",
    access: ["OPEN", "GOVERNED", "RESTRICTED"],
    color: "text-emerald-600"
  },
  { classification: "INTERNAL", access: ["GOVERNED", "RESTRICTED"], color: "text-blue-600" },
  { classification: "CONFIDENTIAL", access: ["RESTRICTED"], color: "text-amber-600" },
  { classification: "RESTRICTED", access: ["RESTRICTED", "PROHIBITED"], color: "text-red-600" }
];

export function AiAccessCascade() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
        <ArrowRight className="text-navy-600 h-5 w-5" />
        AI Access Cascade
      </h2>
      <p className="mb-4 text-sm text-slate-600">
        How classification level maps to which AI systems can access the data
      </p>
      <div className="space-y-3">
        {CASCADE.map((row) => (
          <div
            key={row.classification}
            className="flex items-center gap-4 rounded border border-slate-200 bg-slate-50 px-4 py-3"
          >
            <span className={`w-28 font-medium ${row.color}`}>{row.classification}</span>
            <ArrowRight className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-slate-600">Allowed: {row.access.join(", ")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
