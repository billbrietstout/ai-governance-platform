"use client";

type EuRiskLevel = "MINIMAL" | "LIMITED" | "HIGH" | "UNACCEPTABLE";

const STYLES: Record<EuRiskLevel, string> = {
  MINIMAL: "bg-slatePro-600/30 text-slatePro-300",
  LIMITED: "bg-amber-500/20 text-amber-400",
  HIGH: "bg-orange-500/30 text-orange-400",
  UNACCEPTABLE: "bg-red-500/30 text-red-400"
};

type Props = { level: EuRiskLevel | null };

export function EURiskBadge({ level }: Props) {
  if (!level) return <span className="text-slatePro-500">—</span>;
  const style = STYLES[level] ?? STYLES.MINIMAL;
  return (
    <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${style}`}>
      {level.replace("_", " ")}
    </span>
  );
}
