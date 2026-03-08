/**
 * Report catalogue – 6 report types with export options.
 */
import Link from "next/link";

const REPORTS = [
  {
    id: "compliance-summary",
    name: "Compliance Summary",
    description: "Per framework, per CoSAI layer",
    href: "/reports/compliance-summary"
  },
  {
    id: "gap-analysis",
    name: "Gap Analysis with Remediation Roadmap",
    description: "Critical gaps with owner and due dates",
    href: "/reports/gap-analysis"
  },
  {
    id: "executive-summary",
    name: "Executive Summary",
    description: "1-page board-ready PDF",
    href: "/reports/executive-summary"
  },
  {
    id: "accountability-matrix",
    name: "Accountability Matrix",
    description: "CoSAI RACI across all assets",
    href: "/reports/accountability-matrix"
  },
  {
    id: "vendor-assurance",
    name: "Vendor Assurance Report",
    description: "Posture and expiry status",
    href: "/reports/vendor-assurance"
  },
  {
    id: "scan-coverage",
    name: "Scan Coverage Report",
    description: "What scanned what",
    href: "/reports/scan-coverage"
  }
];

export default function ReportsPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="mt-1 text-slatePro-300">
          Export: PDF, JSON, CSV. Email delivery via Resend (schedule recurring).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map((r) => (
          <Link
            key={r.id}
            href={r.href}
            className="rounded-lg border border-slatePro-700 bg-slatePro-900/50 p-4 transition hover:border-slatePro-600"
          >
            <div className="font-medium text-slatePro-200">{r.name}</div>
            <div className="mt-1 text-sm text-slatePro-500">{r.description}</div>
            <div className="mt-2 flex gap-2 text-xs text-slatePro-400">
              <span>PDF</span>
              <span>JSON</span>
              <span>CSV</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="rounded-lg border border-slatePro-700 bg-slatePro-900/30 p-4">
        <h2 className="text-sm font-medium text-slatePro-400">Email Delivery</h2>
        <p className="mt-1 text-sm text-slatePro-500">
          Schedule recurring reports via Resend. Configure in Settings.
        </p>
      </div>
    </main>
  );
}
