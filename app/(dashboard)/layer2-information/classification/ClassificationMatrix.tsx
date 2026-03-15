type Props = {
  data: {
    matrix: Record<string, Record<string, string>>;
    entityTypes: readonly string[];
    assetTypes: readonly string[];
  };
  colors: Record<string, string>;
};

export function ClassificationMatrix({ data, colors }: Props) {
  const { matrix, entityTypes, assetTypes } = data;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="px-4 py-2 text-left font-medium text-slate-600">Entity Type</th>
            {assetTypes.map((at) => (
              <th key={at} className="px-4 py-2 text-left font-medium text-slate-600">
                {at}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {entityTypes.map((et) => (
            <tr key={et} className="border-b border-slate-100">
              <td className="px-4 py-2 font-medium text-slate-900">{et}</td>
              {assetTypes.map((at) => {
                const policy = matrix[et]?.[at] ?? "RESTRICTED";
                return (
                  <td key={at} className="px-4 py-2">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${colors[policy] ?? "bg-gray-100 text-gray-700"}`}
                    >
                      {policy}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
