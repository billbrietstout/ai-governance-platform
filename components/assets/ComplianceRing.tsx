"use client";

type Props = {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
};

export function ComplianceRing({ percentage, size = 40, strokeWidth = 4, label }: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const color =
    percentage >= 80
      ? "stroke-emerald-500"
      : percentage >= 50
        ? "stroke-amber-500"
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
        <span className="absolute text-xs font-medium text-gray-900">{label}</span>
      ) : (
        <span className="absolute text-xs font-medium text-gray-900">{percentage}%</span>
      )}
    </div>
  );
}
