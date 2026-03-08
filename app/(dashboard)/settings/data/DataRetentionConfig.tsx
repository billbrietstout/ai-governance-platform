"use client";

type Props = {
  retention: { AuditLog: number; TelemetryEvent: number; ScanRecord: number };
};

export function DataRetentionConfig({ retention }: Props) {
  return (
    <div className="rounded-lg border border-slatePro-700 bg-slatePro-900/30 p-4">
      <h2 className="text-sm font-medium text-slatePro-300">Retention policy</h2>
      <ul className="mt-2 space-y-1 text-sm text-slatePro-400">
        <li>AuditLog: {retention.AuditLog} days</li>
        <li>TelemetryEvent: {retention.TelemetryEvent} days</li>
        <li>ScanRecord: {retention.ScanRecord} days</li>
      </ul>
    </div>
  );
}
