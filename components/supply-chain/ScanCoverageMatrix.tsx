"use client";

type ScanCell = {
  scanType: string;
  lastDate: Date | null;
  pass: boolean | null;
  daysSince: number | null;
};

type Row = {
  assetId: string;
  assetName: string;
  scans: ScanCell[];
};

type Props = {
  assets: Row[];
  scanTypes: string[];
  quarterlyDays?: number;
  annualDays?: number;
};

export function ScanCoverageMatrix({
  assets,
  scanTypes,
  quarterlyDays = 92,
  annualDays = 365
}: Props) {
  function getStatus(cell: ScanCell): "red" | "yellow" | "green" {
    if (!cell.lastDate) return "red";
    const days = cell.daysSince ?? 0;
    const maxDays = cell.scanType.includes("RED_TEAM") ? annualDays : quarterlyDays;
    if (days > maxDays) return "red";
    if (days > maxDays * 0.75) return "yellow";
    return cell.pass ? "green" : "yellow";
  }

  const colors = { red: "bg-red-500/30", yellow: "bg-amber-500/30", green: "bg-emerald-500/30" };

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-4 py-2 text-left font-medium text-gray-600">Asset</th>
            {scanTypes.map((st) => (
              <th key={st} className="px-3 py-2 text-center font-medium text-gray-600">
                {st.replace(/_/g, " ")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {assets.map((row) => (
            <tr key={row.assetId} className="border-b border-gray-200 last:border-0 hover:bg-gray-50">
              <td className="px-4 py-2 font-medium text-gray-900">{row.assetName}</td>
              {row.scans.map((cell) => {
                const status = getStatus(cell);
                return (
                  <td key={cell.scanType} className="px-3 py-2 text-center">
                    <span
                      className={`inline-block h-4 w-4 rounded ${colors[status]}`}
                      title={
                        cell.lastDate
                          ? `${cell.scanType}: ${cell.daysSince}d ago, ${cell.pass ? "pass" : "fail"}`
                          : "Never run"
                      }
                    />
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
