import { Shield } from "lucide-react";

const TIERS = [
  {
    level: "PUBLIC",
    color: "border-emerald-500 bg-emerald-50/50",
    title: "PUBLIC",
    description: "No restrictions, safe for AI training and inference"
  },
  {
    level: "INTERNAL",
    color: "border-blue-500 bg-blue-50/50",
    title: "INTERNAL",
    description: "Standard controls, governed AI access permitted"
  },
  {
    level: "CONFIDENTIAL",
    color: "border-amber-500 bg-amber-50/50",
    title: "CONFIDENTIAL",
    description: "Enhanced controls, restricted AI access, logging required"
  },
  {
    level: "RESTRICTED",
    color: "border-red-500 bg-red-50/50",
    title: "RESTRICTED",
    description: "Maximum controls, approved AI systems only, audit trail mandatory"
  }
];

export function ClassificationTierCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {TIERS.map((t) => (
        <div key={t.level} className={`rounded-lg border-l-4 p-4 ${t.color}`}>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-slate-600" />
            <h3 className="font-semibold text-slate-900">{t.title}</h3>
          </div>
          <p className="mt-2 text-sm text-slate-600">{t.description}</p>
        </div>
      ))}
    </div>
  );
}
