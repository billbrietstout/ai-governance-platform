"use client";

type SyncStatus = "PENDING" | "SYNCED" | "FAILED" | "STALE";

type Props = {
  status: SyncStatus;
  lastSyncedAt: Date | null;
  staleThresholdDays?: number;
};

export function CardSyncStatus({ status, lastSyncedAt, staleThresholdDays = 30 }: Props) {
  const now = Date.now();
  const daysSince = lastSyncedAt
    ? Math.floor((now - new Date(lastSyncedAt).getTime()) / 86400000)
    : null;
  const isStale = daysSince !== null && daysSince > staleThresholdDays;

  const label =
    status === "SYNCED"
      ? isStale
        ? "Stale"
        : `Synced ${daysSince}d ago`
      : status === "PENDING"
        ? "Pending"
        : status === "FAILED"
          ? "Failed"
          : "Stale";

  const color =
    status === "SYNCED" && !isStale
      ? "bg-emerald-500/20 text-emerald-400"
      : status === "FAILED"
        ? "bg-red-500/20 text-red-400"
        : "bg-amber-500/20 text-amber-400";

  return (
    <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}
