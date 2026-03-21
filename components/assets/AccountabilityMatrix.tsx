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
    byLayer.set(
      layer,
      assignments.filter((a) => a.cosaiLayer === layer)
    );
  }

  return (
    <div className="border-slatePro-700 overflow-x-auto rounded-lg border">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-slatePro-700 bg-slatePro-900/50 border-b">
            <th className="text-slatePro-300 px-4 py-2 text-left font-medium">Layer</th>
            <th className="text-slatePro-300 px-4 py-2 text-left font-medium">Component</th>
            <th className="text-slatePro-300 px-4 py-2 text-left font-medium">Accountable</th>
            <th className="text-slatePro-300 px-4 py-2 text-left font-medium">Responsible</th>
            <th className="text-slatePro-300 px-4 py-2 text-left font-medium">Supporting</th>
            {onEdit && <th className="px-4 py-2" />}
          </tr>
        </thead>
        <tbody>
          {layers.map((layer) => {
            const rows = byLayer.get(layer) ?? [];
            if (rows.length === 0) {
              return (
                <tr key={layer} className="border-slatePro-800 border-b">
                  <td className="text-slatePro-400 px-4 py-2">{layer.replace(/_/g, " ")}</td>
                  <td colSpan={onEdit ? 5 : 4} className="px-4 py-2 text-amber-700">
                    No assignments — gap
                  </td>
                </tr>
              );
            }
            return rows.map((a) => (
              <tr key={a.id} className="border-slatePro-800 border-b last:border-0">
                <td className="text-slatePro-400 px-4 py-2">{layer.replace(/_/g, " ")}</td>
                <td className="text-slatePro-200 px-4 py-2">{a.componentName}</td>
                <td className="text-slatePro-200 px-4 py-2">{a.accountableParty}</td>
                <td className="text-slatePro-200 px-4 py-2">{a.responsibleParty}</td>
                <td className="text-slatePro-500 px-4 py-2">
                  {a.supportingParties?.length ? a.supportingParties.join(", ") : "—"}
                </td>
                {onEdit && (
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      onClick={() => onEdit(a)}
                      className="text-navy-400 text-xs hover:underline"
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
