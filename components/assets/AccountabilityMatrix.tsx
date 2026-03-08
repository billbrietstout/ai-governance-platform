"use client";

type Assignment = {
  id: string;
  componentName: string;
  cosaiLayer: string;
  accountableParty: string;
  responsibleParty: string;
  supportingParties?: string[];
};

type Props = {
  assignments: Assignment[];
  layers: string[];
  onEdit?: (a: Assignment) => void;
};

export function AccountabilityMatrix({ assignments, layers, onEdit }: Props) {
  const byLayer = new Map<string, Assignment[]>();
  for (const layer of layers) {
    byLayer.set(layer, assignments.filter((a) => a.cosaiLayer === layer));
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slatePro-700">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-slatePro-700 bg-slatePro-900/50">
            <th className="px-4 py-2 text-left font-medium text-slatePro-300">Layer</th>
            <th className="px-4 py-2 text-left font-medium text-slatePro-300">Component</th>
            <th className="px-4 py-2 text-left font-medium text-slatePro-300">Accountable</th>
            <th className="px-4 py-2 text-left font-medium text-slatePro-300">Responsible</th>
            <th className="px-4 py-2 text-left font-medium text-slatePro-300">Supporting</th>
            {onEdit && <th className="px-4 py-2" />}
          </tr>
        </thead>
        <tbody>
          {layers.map((layer) => {
            const rows = byLayer.get(layer) ?? [];
            if (rows.length === 0) {
              return (
                <tr key={layer} className="border-b border-slatePro-800">
                  <td className="px-4 py-2 text-slatePro-400">{layer.replace(/_/g, " ")}</td>
                  <td colSpan={onEdit ? 5 : 4} className="px-4 py-2 text-amber-400">
                    No assignments — gap
                  </td>
                </tr>
              );
            }
            return rows.map((a) => (
              <tr key={a.id} className="border-b border-slatePro-800 last:border-0">
                <td className="px-4 py-2 text-slatePro-400">{layer.replace(/_/g, " ")}</td>
                <td className="px-4 py-2 text-slatePro-200">{a.componentName}</td>
                <td className="px-4 py-2 text-slatePro-200">{a.accountableParty}</td>
                <td className="px-4 py-2 text-slatePro-200">{a.responsibleParty}</td>
                <td className="px-4 py-2 text-slatePro-500">
                  {a.supportingParties?.length ? a.supportingParties.join(", ") : "—"}
                </td>
                {onEdit && (
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      onClick={() => onEdit(a)}
                      className="text-navy-400 hover:underline text-xs"
                    >
                      Edit
                    </button>
                  </td>
                )}
              </tr>
            ));
          })}
        </tbody>
      </table>
    </div>
  );
}
