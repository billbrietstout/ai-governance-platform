/**
 * Data retention config, GDPR request management.
 */
import Link from "next/link";
import { getRetentionDays } from "@/lib/data/retention";
import { DataRetentionConfig } from "./DataRetentionConfig";
import { GDPRRequests } from "./GDPRRequests";

export default async function DataSettingsPage() {
  const retention = {
    AuditLog: getRetentionDays("AuditLog"),
    TelemetryEvent: getRetentionDays("TelemetryEvent"),
    ScanRecord: getRetentionDays("ScanRecord")
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 px-6 py-10">
      <div>
        <Link href="/settings" className="text-sm text-navy-600 hover:underline">
          ← Settings
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">Data & Privacy</h1>
        <p className="mt-1 text-gray-600">
          Retention policy and GDPR requests.
        </p>
      </div>

      <DataRetentionConfig retention={retention} />
      <GDPRRequests />
    </main>
  );
}
