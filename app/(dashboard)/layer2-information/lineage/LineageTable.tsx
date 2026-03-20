import Link from "next/link";

type LineageRecord = {
  id: string;
  name: string;
  pipelineType: string;
  sourceEntity: { id: string; name: string } | null;
  targetAsset: { id: string; name: string } | null;
  dataClassification: string;
  refreshFrequency: string | null;
  lastRun: Date | null;
  status: string;
  owner: { email: string } | null;
};

type Props = {
  records: LineageRecord[];
  classificationColors: Record<string, string>;
};

export function LineageTable({ records, classificationColors }: Props) {
  if (records.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="px-4 py-2 text-left font-medium text-slate-600">Pipeline</th>
            <th className="px-4 py-2 text-left font-medium text-slate-600">Type</th>
            <th className="px-4 py-2 text-left font-medium text-slate-600">Source → Target</th>
            <th className="px-4 py-2 text-left font-medium text-slate-600">Classification</th>
            <th className="px-4 py-2 text-left font-medium text-slate-600">Frequency</th>
            <th className="px-4 py-2 text-left font-medium text-slate-600">Last Run</th>
            <th className="px-4 py-2 text-left font-medium text-slate-600">Status</th>
            <th className="px-4 py-2 text-left font-medium text-slate-600">Owner</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <tr key={r.id} className="border-b border-slate-100">
              <td className="px-4 py-2 font-medium text-slate-900">{r.name}</td>
              <td className="px-4 py-2">
                <span className="bg-navy-100 text-navy-700 rounded px-2 py-0.5 text-xs font-medium">
                  {r.pipelineType}
                </span>
              </td>
              <td className="px-4 py-2">
                <span className="text-slate-600">
                  {r.sourceEntity ? (
                    <Link
                      href={`/layer2-information/master-data?highlight=${r.sourceEntity.id}`}
                      className="hover:underline"
                    >
                      {r.sourceEntity.name}
                    </Link>
                  ) : (
                    "—"
                  )}{" "}
                  →{" "}
                  {r.targetAsset ? (
                    <Link
                      href={`/layer3-application/assets/${r.targetAsset.id}`}
                      className="hover:underline"
                    >
                      {r.targetAsset.name}
                    </Link>
                  ) : (
                    "—"
                  )}
                </span>
              </td>
              <td className="px-4 py-2">
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${classificationColors[r.dataClassification] ?? "bg-gray-100 text-gray-700"}`}
                >
                  {r.dataClassification}
                </span>
              </td>
              <td className="px-4 py-2 text-slate-600">{r.refreshFrequency ?? "—"}</td>
              <td className="px-4 py-2 text-slate-600">
                {r.lastRun ? new Date(r.lastRun).toLocaleDateString() : "—"}
              </td>
              <td className="px-4 py-2">
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${
                    r.status === "ACTIVE"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {r.status}
                </span>
              </td>
              <td className="px-4 py-2 text-slate-600">{r.owner?.email ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
