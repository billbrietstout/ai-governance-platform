"use client";

import { Bot, Cpu, User, UserCog } from "lucide-react";

type AutonomyLevel = "HUMAN_ONLY" | "ASSISTED" | "SEMI_AUTONOMOUS" | "AUTONOMOUS";

const STYLES: Record<AutonomyLevel, string> = {
  HUMAN_ONLY: "bg-gray-100 text-gray-700",
  ASSISTED: "bg-navy-100 text-navy-700",
  SEMI_AUTONOMOUS: "bg-amber-100 text-amber-700",
  AUTONOMOUS: "bg-orange-100 text-orange-700"
};

const ICONS = {
  HUMAN_ONLY: User,
  ASSISTED: UserCog,
  SEMI_AUTONOMOUS: Bot,
  AUTONOMOUS: Cpu
} as const;

type Props = { level: AutonomyLevel | null };

export function AutonomyBadge({ level }: Props) {
  if (!level) return <span className="text-gray-500">—</span>;
  const style = STYLES[level] ?? STYLES.HUMAN_ONLY;
  const Icon = ICONS[level] ?? User;
  const text = level.replace(/_/g, " ");
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${style}`}
      aria-label={`Autonomy: ${text}`}
    >
      <Icon className="h-3 w-3 shrink-0" aria-hidden />
      {text}
    </span>
  );
}
