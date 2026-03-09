"use client";

type Props = {
  retention: { AuditLog: number; TelemetryEvent: number; ScanRecord: number };
};

export function DataRetentionConfig({ retention }: Props) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-medium text-gray-900">Retention policy</h2>
      <ul className="mt-2 space-y-1 text-sm text-gray-600">
        <li>AuditLog: {retention.AuditLog} days</li>
        <li>TelemetryEvent: {retention.TelemetryEvent} days</li>
        <li>ScanRecord: {retention.ScanRecord} days</li>
      </ul>
    </div>
  );
}
