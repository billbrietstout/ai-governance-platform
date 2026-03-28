"use client";

import { complianceTextClass } from "@/lib/ui/compliance-score";

type Props = {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
};

/** Ring stroke aligns with app compliance ramp: &lt;40% red, 40–70% amber, &gt;70% green */
export function ComplianceRing({ percentage, size = 40, strokeWidth = 4, label }: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const color =
    percentage > 70
      ? "stroke-green-500"
      : percentage >= 40
        ? "stroke-amber-400"
        : "stroke-red-500";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${color} transition-all duration-500`}
        />
      </svg>
      {label !== undefined ? (
        <span className="data-value absolute text-xs font-medium text-gray-900">{label}</span>
      ) : (
        <span
          className={`data-value absolute text-xs font-medium ${complianceTextClass(percentage)}`}
        >
          {percentage}%
        </span>
      )}
    </div>
  );
}
