"use client";

type AutonomyLevel = "HUMAN_ONLY" | "ASSISTED" | "SEMI_AUTONOMOUS" | "AUTONOMOUS";

const STYLES: Record<AutonomyLevel, string> = {
  HUMAN_ONLY: "bg-slatePro-600/30 text-slatePro-300",
  ASSISTED: "bg-navy-500/20 text-navy-300",
  SEMI_AUTONOMOUS: "bg-amber-500/20 text-amber-400",
  AUTONOMOUS: "bg-orange-500/30 text-orange-400"
};

type Props = { level: AutonomyLevel | null };

export function AutonomyBadge({ level }: Props) {
  if (!level) return <span className="text-slatePro-500">—</span>;
  const style = STYLES[level] ?? STYLES.HUMAN_ONLY;
  return (
    <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${style}`}>
      {level.replace(/_/g, " ")}
    </span>
  );
}
