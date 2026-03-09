"use client";

type EuRiskLevel = "MINIMAL" | "LIMITED" | "HIGH" | "UNACCEPTABLE";

const STYLES: Record<EuRiskLevel, string> = {
  MINIMAL: "bg-gray-100 text-gray-700",
  LIMITED: "bg-amber-100 text-amber-700",
  HIGH: "bg-orange-100 text-orange-700",
  UNACCEPTABLE: "bg-red-100 text-red-700"
};

type Props = { level: EuRiskLevel | null };

export function EURiskBadge({ level }: Props) {
  if (!level) return <span className="text-gray-500">—</span>;
  const style = STYLES[level] ?? STYLES.MINIMAL;
  return (
    <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${style}`}>
      {level.replace("_", " ")}
    </span>
  );
}
