"use client";

import { Ban, ShieldAlert, ShieldCheck } from "lucide-react";

type EuRiskLevel = "MINIMAL" | "LIMITED" | "HIGH" | "UNACCEPTABLE";

const STYLES: Record<EuRiskLevel, string> = {
  MINIMAL: "bg-gray-100 text-gray-700",
  LIMITED: "bg-amber-100 text-amber-700",
  HIGH: "bg-orange-100 text-orange-700",
  UNACCEPTABLE: "bg-red-100 text-red-700"
};

const ICONS = {
  MINIMAL: ShieldCheck,
  LIMITED: ShieldAlert,
  HIGH: ShieldAlert,
  UNACCEPTABLE: Ban
} as const;

const LABELS: Record<EuRiskLevel, string> = {
  MINIMAL: "Minimal",
  LIMITED: "Limited",
  HIGH: "High",
  UNACCEPTABLE: "Unacceptable"
};

type Props = { level: EuRiskLevel | null };

export function EURiskBadge({ level }: Props) {
  if (!level) return <span className="text-gray-500">—</span>;
  const style = STYLES[level] ?? STYLES.MINIMAL;
  const Icon = ICONS[level] ?? ShieldCheck;
  const label = LABELS[level] ?? level.replace(/_/g, " ");
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${style}`}
      aria-label={`EU AI Act risk: ${label}`}
    >
      <Icon className="h-3 w-3 shrink-0" aria-hidden />
      {label}
    </span>
  );
}
